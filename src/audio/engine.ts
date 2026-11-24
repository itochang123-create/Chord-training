import type { VoicedChord } from '../theory/chord.ts'
import { beatsPerChord, frameAt, planWindow, selectDispatches, type AccompanimentId, type PlannedNote } from './plan.ts'
import { secondsPerBeat } from './meter.ts'
import { TransportGate, type TransportStatus } from './transport.ts'

export type PerformanceConfig = {
  bpm: number
  accompaniment: AccompanimentId
  loop: boolean
  volume: number
  voiced: VoicedChord[]
  signature: string
}

export type VisualFrame = {
  status: TransportStatus
  interrupted: boolean
  audioReady: boolean
  chordIndex: number
  chordBeatIndex: number
  barBeatIndex: number
  active: Array<{ midi: number; role: 'bass' | 'rh' }>
}

type Voice = {
  gain: GainNode
  oscillators: OscillatorNode[]
}

const EMPTY: PerformanceConfig = {
  bpm: 76,
  accompaniment: 'bass-chord',
  loop: true,
  volume: 0.8,
  voiced: [],
  signature: '',
}

export function performanceSignature(config: Omit<PerformanceConfig, 'signature' | 'volume'>): string {
  const chords = config.voiced
    .map((chord) => `${chord.chord.symbol}@${chord.bassMidi}:${chord.rhMidis.join('.')}`)
    .join('|')
  return [chords, config.bpm, config.accompaniment, Number(config.loop)].join(';')
}

function safeGain(volume: number): number {
  return Math.min(1, Math.max(0, volume)) * 0.38
}

function framesEqual(a: VisualFrame, b: VisualFrame): boolean {
  if (
    a.status !== b.status ||
    a.interrupted !== b.interrupted ||
    a.audioReady !== b.audioReady ||
    a.chordIndex !== b.chordIndex ||
    a.chordBeatIndex !== b.chordBeatIndex ||
    a.barBeatIndex !== b.barBeatIndex ||
    a.active.length !== b.active.length
  ) {
    return false
  }
  return a.active.every((note, index) => note.midi === b.active[index].midi && note.role === b.active[index].role)
}

/**
 * Web Audio transport. Note times are audio-clock beats. The picture is polled
 * from that same clock, so the keys cannot drift on their own timer.
 * Playback starts only after a user gesture resumes the context.
 */
export class PlaybackEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private voices = new Set<Voice>()
  private gate = new TransportGate()
  private config: PerformanceConfig = EMPTY
  private originAudio = 0
  private originBeat = 0
  private timer = 0
  private rafId = 0
  private dispatched = new Set<string>()
  private listeners = new Set<() => void>()
  private heard = false
  private frame: VisualFrame = {
    status: 'stopped',
    interrupted: false,
    audioReady: false,
    chordIndex: 0,
    chordBeatIndex: 0,
    barBeatIndex: 0,
    active: [],
  }

  constructor() {
    document.addEventListener('visibilitychange', this.onHide)
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getFrame = (): VisualFrame => this.frame

  get status(): TransportStatus {
    return this.gate.status
  }

  setPerformance(next: PerformanceConfig): void {
    const previous = this.config
    this.config = {
      ...next,
      bpm: Math.min(208, Math.max(36, next.bpm)),
      volume: Math.min(1, Math.max(0, next.volume)),
    }
    this.applyVolume(this.config.volume)
    if (this.gate.status !== 'playing' || !this.ctx) {
      this.publish()
      return
    }
    if (previous.signature === this.config.signature) {
      this.publish()
      return
    }
    const symbolsChanged = symbolKey(previous) !== symbolKey(this.config)
    const beat = symbolsChanged ? 0 : Math.max(0, this.currentBeat())
    this.silence()
    this.dispatched.clear()
    this.originBeat = beat
    this.originAudio = this.ctx.currentTime + 0.03
    this.publish()
  }

  async play(): Promise<void> {
    const request = this.gate.requestPlay()
    if (request.type === 'ignore') return
    try {
      await this.ensureRunning()
    } catch {
      this.publish()
      return
    }
    if (!this.ctx || !this.gate.commit(request.token)) return
    this.heard = true
    this.originBeat = request.fromBeat
    this.originAudio = this.ctx.currentTime + 0.05
    this.dispatched.clear()
    this.silence()
    this.startLoops()
    this.publish()
  }

  pause(): void {
    if (this.gate.status !== 'playing') return
    this.gate.pause(this.currentBeat())
    this.silence()
    this.dispatched.clear()
    this.stopLoops()
    this.publish()
  }

  stop(): void {
    this.gate.stop()
    this.silence()
    this.dispatched.clear()
    this.stopLoops()
    this.publish()
  }

  async restart(): Promise<void> {
    this.stop()
    await this.play()
  }

  async toggle(): Promise<void> {
    if (this.gate.status === 'playing') this.pause()
    else await this.play()
  }

  dispose(): void {
    document.removeEventListener('visibilitychange', this.onHide)
    this.ctx?.removeEventListener('statechange', this.onState)
    this.stop()
    void this.ctx?.close()
    this.ctx = null
  }

  private onHide = (): void => {
    if (document.hidden && this.gate.status === 'playing') this.interrupt()
  }

  private onState = (): void => {
    if (this.ctx && this.ctx.state !== 'running' && this.gate.status === 'playing') this.interrupt()
  }

  private interrupt(): void {
    this.gate.interrupt(Math.max(0, this.currentBeat()))
    this.silence()
    this.dispatched.clear()
    this.stopLoops()
    this.publish()
  }

  private async ensureRunning(): Promise<void> {
    if (!this.ctx) this.createContext()
    if (!this.ctx) throw new Error('Audio is unavailable')
    if (this.ctx.state !== 'running') await this.ctx.resume()
    if (this.ctx.state !== 'running') throw new Error('Audio did not start')
  }

  private createContext(): void {
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = safeGain(this.config.volume)
    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -18
    compressor.knee.value = 12
    compressor.ratio.value = 4
    compressor.attack.value = 0.003
    compressor.release.value = 0.18
    master.connect(compressor)
    compressor.connect(ctx.destination)
    ctx.addEventListener('statechange', this.onState)
    this.ctx = ctx
    this.master = master
  }

  private applyVolume(volume: number): void {
    if (!this.ctx || !this.master) return
    this.master.gain.setTargetAtTime(safeGain(volume), this.ctx.currentTime, 0.02)
  }

  private startLoops(): void {
    this.stopLoops()
    const tick = () => {
      if (this.gate.status !== 'playing') return
      this.scheduleAhead()
      if (!this.config.loop && this.currentBeat() >= this.totalBeats() - 0.001) {
        this.stop()
        return
      }
      this.publish()
    }
    tick()
    this.timer = window.setInterval(tick, 25)
    const draw = () => {
      if (this.gate.status !== 'playing') return
      this.publish()
      this.rafId = window.requestAnimationFrame(draw)
    }
    this.rafId = window.requestAnimationFrame(draw)
  }

  private stopLoops(): void {
    if (this.timer) window.clearInterval(this.timer)
    if (this.rafId) window.cancelAnimationFrame(this.rafId)
    this.timer = 0
    this.rafId = 0
  }

  private scheduleAhead(): void {
    if (!this.ctx || this.gate.status !== 'playing' || this.config.voiced.length === 0) return
    const nowBeat = this.currentBeat()
    const horizonBeats = 0.22 / secondsPerBeat(this.config.bpm)
    const notes = planWindow({
      voiced: this.config.voiced,
      accompaniment: this.config.accompaniment,
      loop: this.config.loop,
      fromBeat: Math.max(0, nowBeat - beatsPerChord(this.config.accompaniment)),
      toBeat: nowBeat + horizonBeats,
    })
    for (const note of selectDispatches(notes, nowBeat, horizonBeats, this.dispatched)) {
      const start = this.audioTime(note.startBeat)
      const end = this.audioTime(note.endBeat)
      if (end <= this.ctx.currentTime + 0.02) continue
      this.dispatched.add(note.id)
      this.startVoice(note, Math.max(start, this.ctx.currentTime + 0.005), end)
    }
  }

  private startVoice(note: PlannedNote, when: number, end: number): void {
    if (!this.ctx || !this.master) return
    if (note.role === 'click') {
      this.startClick(note.accent, when)
      return
    }
    const ctx = this.ctx
    const fundamental = ctx.createOscillator()
    const overtone = ctx.createOscillator()
    const overtoneGain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    const freq = 440 * 2 ** ((note.midi - 69) / 12)
    if (note.role === 'bass') {
      fundamental.type = 'sine'
      overtone.type = 'triangle'
      overtone.frequency.setValueAtTime(freq, when)
      overtone.detune.setValueAtTime(7, when)
      overtoneGain.gain.setValueAtTime(0.35, when)
      filter.frequency.setValueAtTime(520, when)
    } else {
      fundamental.type = 'triangle'
      overtone.type = 'sine'
      overtone.frequency.setValueAtTime(freq * 2, when)
      overtoneGain.gain.setValueAtTime(0.18, when)
      filter.frequency.setValueAtTime(1800, when)
    }
    fundamental.frequency.setValueAtTime(freq, when)
    filter.type = 'lowpass'
    filter.Q.setValueAtTime(0.7, when)
    const peak = Math.max(0.0002, (note.role === 'bass' ? 0.2 : 0.09) * note.velocity)
    const attack = 0.012
    const releaseAt = Math.max(when + 0.04, end - 0.045)
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.exponentialRampToValueAtTime(peak, when + attack)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * 0.5), Math.min(releaseAt, when + attack + 0.18))
    gain.gain.setValueAtTime(Math.max(0.0002, peak * 0.5), releaseAt)
    gain.gain.exponentialRampToValueAtTime(0.0001, releaseAt + 0.06)
    fundamental.connect(filter)
    overtone.connect(overtoneGain)
    overtoneGain.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    fundamental.start(when)
    overtone.start(when)
    const stopAt = releaseAt + 0.07
    fundamental.stop(stopAt)
    overtone.stop(stopAt)
    const voice: Voice = { gain, oscillators: [fundamental, overtone] }
    this.voices.add(voice)
    fundamental.onended = () => this.voices.delete(voice)
  }

  private startClick(accent: boolean, when: number): void {
    if (!this.ctx || !this.master) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(accent ? 1600 : 1080, when)
    const peak = accent ? 0.045 : 0.028
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.003)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.028)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(when)
    osc.stop(when + 0.03)
    const voice: Voice = { gain, oscillators: [osc] }
    this.voices.add(voice)
    osc.onended = () => this.voices.delete(voice)
  }

  private silence(): void {
    const when = this.ctx?.currentTime ?? 0
    for (const voice of this.voices) {
      try {
        voice.gain.gain.cancelScheduledValues(when)
        const current = Math.max(voice.gain.gain.value, 0.0001)
        voice.gain.gain.setValueAtTime(current, when)
        voice.gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.03)
        for (const osc of voice.oscillators) osc.stop(when + 0.04)
      } catch {
        // The node may already have stopped.
      }
    }
    this.voices.clear()
  }

  private audioTime(beat: number): number {
    return this.originAudio + (beat - this.originBeat) * secondsPerBeat(this.config.bpm)
  }

  private currentBeat(): number {
    if (!this.ctx || this.gate.status !== 'playing') return this.gate.beat
    return this.originBeat + (this.ctx.currentTime - this.originAudio) / secondsPerBeat(this.config.bpm)
  }

  private totalBeats(): number {
    return this.config.voiced.length * beatsPerChord(this.config.accompaniment)
  }

  private publish(): void {
    const next = this.computeFrame()
    if (framesEqual(this.frame, next)) return
    this.frame = next
    for (const listener of this.listeners) listener()
  }

  private computeFrame(): VisualFrame {
    const beat = this.gate.status === 'playing' ? Math.max(0, this.currentBeat()) : this.gate.beat
    const info = frameAt(
      {
        voiced: this.config.voiced,
        accompaniment: this.config.accompaniment,
        loop: this.config.loop,
      },
      beat,
    )
    return {
      status: this.gate.status,
      interrupted: this.gate.interrupted,
      audioReady: this.heard && this.ctx?.state === 'running',
      chordIndex: info.chordIndex,
      chordBeatIndex: info.chordBeatIndex,
      barBeatIndex: info.barBeatIndex,
      active: this.gate.status === 'playing' ? info.active : [],
    }
  }
}

function symbolKey(config: PerformanceConfig): string {
  return config.voiced.map((chord) => chord.chord.symbol).join('|')
}
