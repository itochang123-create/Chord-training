import type { VoicedChord } from '../theory/chord.ts'
import { secondsPerBeat } from './meter.ts'

export type AccompanimentId = 'audition' | 'block' | 'bass-chord' | 'arpeggio' | 'alberti' | 'waltz' | 'ballad'

export const ACCOMPANIMENT_IDS: AccompanimentId[] = [
  'audition',
  'block',
  'bass-chord',
  'arpeggio',
  'alberti',
  'waltz',
  'ballad',
]

export const ACCOMPANIMENTS: Record<AccompanimentId, { label: string; feel: string; beatsPerChord: number }> = {
  audition: {
    label: 'Plain chord',
    feel: 'One attack, then the chord holds. No rhythmic pattern.',
    beatsPerChord: 4,
  },
  block: {
    label: 'Block chords',
    feel: 'The whole chord together, twice in the bar, with a breath between.',
    beatsPerChord: 4,
  },
  'bass-chord': {
    label: 'Bass and chord',
    feel: 'Bass on beats 1 and 3, the chord on beats 2 and 4.',
    beatsPerChord: 4,
  },
  arpeggio: {
    label: 'Broken chord',
    feel: 'One note at a time, up and back. Each note ends before the next.',
    beatsPerChord: 4,
  },
  alberti: {
    label: 'Alberti bass',
    feel: 'Low, high, middle, high. The bass note sounds on the beat.',
    beatsPerChord: 4,
  },
  waltz: {
    label: 'Waltz',
    feel: 'Bass, then chord, then chord. The pattern itself is in three.',
    beatsPerChord: 3,
  },
  ballad: {
    label: 'Ballad roll',
    feel: 'The bass holds while the right hand rolls through the chord.',
    beatsPerChord: 4,
  },
}

export function beatsPerChord(id: AccompanimentId): number {
  return ACCOMPANIMENTS[id].beatsPerChord
}

export function isAccompanimentId(value: string): value is AccompanimentId {
  return (ACCOMPANIMENT_IDS as string[]).includes(value)
}

export type PlannedNote = {
  id: string
  midi: number
  startBeat: number
  endBeat: number
  role: 'bass' | 'rh' | 'click'
  chordIndex: number
  velocity: number
  accent: boolean
}

export type PlanInput = {
  voiced: VoicedChord[]
  accompaniment: AccompanimentId
  loop: boolean
  fromBeat: number
  toBeat: number
}

type Hit = {
  beat: number
  dur: number
  part: 'bass' | 'rh-all' | 'rh-one'
  arpIndex?: number
}

export function planWindow(input: PlanInput): PlannedNote[] {
  const { voiced } = input
  const beats = beatsPerChord(input.accompaniment)
  if (voiced.length === 0 || input.toBeat <= input.fromBeat) return []
  const span = voiced.length * beats
  const notes: PlannedNote[] = []
  const scanFrom = Math.max(0, input.fromBeat - beats)
  if (!input.loop && scanFrom >= span) return notes

  const first = Math.max(0, Math.floor(scanFrom / beats))
  const last = Math.floor((input.toBeat - 1e-9) / beats)
  for (let instance = first; instance <= last; instance += 1) {
    if (!input.loop && instance >= voiced.length) break
    if (instance < 0) continue
    const chordIndex = ((instance % voiced.length) + voiced.length) % voiced.length
    const chordStart = instance * beats
    const chord = voiced[chordIndex]
    const hits = accompanimentHits(input.accompaniment, chord.rhMidis.length)
    hits.forEach((hit, hitIndex) => {
      const startBeat = chordStart + hit.beat
      const endBeat = Math.min(chordStart + beats, startBeat + hit.dur)
      if (endBeat <= input.fromBeat + 1e-9 || startBeat >= input.toBeat - 1e-9) return
      midisFor(hit, chord).forEach((midi, midiIndex) => {
        notes.push({
          id: `${hit.part}:${hitIndex}:${startBeat.toFixed(4)}:${midi}:${midiIndex}`,
          midi,
          startBeat,
          endBeat,
          role: hit.part === 'bass' ? 'bass' : 'rh',
          chordIndex,
          velocity: hit.part === 'bass' ? 0.92 : 0.76,
          accent: false,
        })
      })
    })
  }
  return notes
}

export function soundingAt(
  input: Omit<PlanInput, 'fromBeat' | 'toBeat'>,
  beat: number,
): Array<{ midi: number; role: 'bass' | 'rh' }> {
  if (!(beat >= 0)) return []
  return planWindow({ ...input, fromBeat: beat, toBeat: beat + 1e-4 })
    .filter((note) => note.startBeat <= beat + 1e-8 && beat < note.endBeat - 1e-8)
    .map((note) => ({ midi: note.midi, role: note.role as 'bass' | 'rh' }))
}

export type FrameInfo = {
  chordIndex: number
  active: Array<{ midi: number; role: 'bass' | 'rh' }>
  beatInChord: number
  chordBeatIndex: number
  barBeatIndex: number
  finished: boolean
}

export function frameAt(input: Omit<PlanInput, 'fromBeat' | 'toBeat'>, beat: number): FrameInfo {
  const count = input.voiced.length
  const beats = beatsPerChord(input.accompaniment)
  const span = count * beats
  if (count === 0) {
    return { chordIndex: 0, active: [], beatInChord: 0, chordBeatIndex: 0, barBeatIndex: 0, finished: true }
  }
  const finished = !input.loop && beat >= span - 1e-8
  const position = input.loop ? beat - Math.floor(beat / span) * span : Math.min(Math.max(0, beat), span)
  const chordIndex = finished ? count - 1 : Math.min(count - 1, Math.floor(position / beats))
  const beatInChord = finished ? 0 : position - chordIndex * beats
  return {
    chordIndex,
    active: finished ? [] : soundingAt(input, beat),
    beatInChord,
    chordBeatIndex: finished ? 0 : Math.floor(beatInChord + 1e-8),
    barBeatIndex: 0,
    finished,
  }
}

export function selectDispatches(
  notes: PlannedNote[],
  nowBeat: number,
  horizonBeats: number,
  already: ReadonlySet<string>,
): PlannedNote[] {
  return notes.filter(
    (note) => !already.has(note.id) && note.endBeat > nowBeat && note.startBeat < nowBeat + horizonBeats,
  )
}

export function chordSeconds(bpm: number, id: AccompanimentId): number {
  return beatsPerChord(id) * secondsPerBeat(bpm)
}

function accompanimentHits(id: AccompanimentId, rhCount: number): Hit[] {
  const beats = beatsPerChord(id)
  if (id === 'audition') {
    return [
      { beat: 0, dur: beats, part: 'bass' },
      { beat: 0, dur: beats, part: 'rh-all' },
    ]
  }
  if (id === 'block') {
    return [0, 2].flatMap((beat) => [
      { beat, dur: 1.65, part: 'bass' as const },
      { beat, dur: 1.65, part: 'rh-all' as const },
    ])
  }
  if (id === 'bass-chord') {
    return [0, 1, 2, 3].map((beat) => ({
      beat,
      dur: 0.82,
      part: (beat % 2 === 0 ? 'bass' : 'rh-all') as Hit['part'],
    }))
  }
  if (id === 'arpeggio') return gridHits(0.5, beats, arpCycle(rhCount), 0.42, false)
  if (id === 'alberti') return gridHits(0.5, beats, albertiCycle(rhCount), 0.4, true)
  if (id === 'waltz') {
    return [
      { beat: 0, dur: 0.9, part: 'bass' },
      { beat: 1, dur: 0.85, part: 'rh-all' },
      { beat: 2, dur: 0.85, part: 'rh-all' },
    ]
  }
  return [
    { beat: 0, dur: 1.85, part: 'bass' },
    { beat: 2, dur: 1.85, part: 'bass' },
    ...gridHits(0.5, beats, rollCycle(rhCount), 0.4, false),
  ]
}

function gridHits(
  step: number,
  beats: number,
  cycle: Array<'bass' | number>,
  dur: number,
  bassOnBeat: boolean,
): Hit[] {
  const hits: Hit[] = []
  let index = 0
  for (let beat = 0; beat < beats - 1e-6; beat += step) {
    const token = cycle[index % cycle.length]
    index += 1
    const length = Math.min(dur, beats - beat)
    if (token === 'bass') hits.push({ beat, dur: length, part: 'bass' })
    else hits.push({ beat, dur: length, part: 'rh-one', arpIndex: token })
    if (bassOnBeat && Math.abs(beat - Math.round(beat)) < 1e-6) {
      hits.push({ beat, dur: Math.min(0.45, beats - beat), part: 'bass' })
    }
  }
  return hits
}

function arpCycle(rhCount: number): Array<'bass' | number> {
  const count = Math.max(rhCount, 1)
  const cycle: Array<'bass' | number> = ['bass']
  for (let index = 0; index < count; index += 1) cycle.push(index)
  for (let index = count - 2; index >= 1; index -= 1) cycle.push(index)
  return cycle
}

function albertiCycle(rhCount: number): number[] {
  if (rhCount >= 3) return [0, Math.min(2, rhCount - 1), 1, Math.min(2, rhCount - 1)]
  if (rhCount === 2) return [0, 1, 0, 1]
  return [0]
}

function rollCycle(rhCount: number): number[] {
  if (rhCount >= 3) return [0, 1, 2, 1]
  if (rhCount === 2) return [0, 1]
  return [0]
}

function midisFor(hit: Hit, chord: VoicedChord): number[] {
  if (hit.part === 'bass') return [chord.bassMidi]
  if (hit.part === 'rh-all') return [...chord.rhMidis]
  if (chord.rhMidis.length === 0) return []
  return [chord.rhMidis[(hit.arpIndex ?? 0) % chord.rhMidis.length]]
}
