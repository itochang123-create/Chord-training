import type { VoicedChord } from '../theory/chord.ts'
import { secondsPerBeat } from './meter.ts'

export type AccompanimentId =
  | 'audition'
  | 'block'
  | 'bass-chord'
  | 'swing'
  | 'boogie'
  | 'jump'
  | 'bebop'
  | 'arpeggio'
  | 'alberti'
  | 'waltz'
  | 'ballad'
  | 'stride'
  | 'walking'
  | 'pedal'
  | 'broken-octaves'
  | 'rolled'
  | 'pop-eighths'
  | 'rock'
  | 'hymn'
  | 'jazz'
  | 'gospel'
  | 'bossa'
  | 'march'
  | 'tremolo'
  | 'tresillo'

export const ACCOMPANIMENT_IDS: AccompanimentId[] = [
  'audition',
  'block',
  'bass-chord',
  'swing',
  'boogie',
  'jump',
  'bebop',
  'stride',
  'walking',
  'pedal',
  'arpeggio',
  'alberti',
  'broken-octaves',
  'rolled',
  'ballad',
  'pop-eighths',
  'rock',
  'waltz',
  'hymn',
  'jazz',
  'gospel',
  'bossa',
  'march',
  'tremolo',
  'tresillo',
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
  swing: {
    label: 'Swing shuffle',
    feel: 'Swung eighths. Bass on 1 and 3, a short chord on the offbeat.',
    beatsPerChord: 4,
  },
  boogie: {
    label: 'Boogie-woogie',
    feel: 'Swung eighths. The left hand walks root, 3rd, 5th, 6th, and flat 7. Short chords on the and of 2 and 4.',
    beatsPerChord: 4,
  },
  jump: {
    label: 'Jump blues',
    feel: 'A driving shuffle. Left hand rocks root-and-fifth with root-and-sixth, and the right hand punches 2 and 4.',
    beatsPerChord: 4,
  },
  bebop: {
    label: 'Bebop comp',
    feel: 'Walking quarter-note bass into the next root. The right hand comps short rootless chords on swung offbeats.',
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
  stride: {
    label: 'Stride',
    feel: 'Low bass on 1, the chord on 2, a higher bass note on 3, the chord again on 4.',
    beatsPerChord: 4,
  },
  walking: {
    label: 'Walking bass',
    feel: 'The bass walks root, chord tone, fifth, and a step toward the next chord. No right-hand stabs.',
    beatsPerChord: 4,
  },
  pedal: {
    label: 'Pedal bass',
    feel: 'One bass note holds the whole bar. The chord taps on 2 and 4.',
    beatsPerChord: 4,
  },
  'broken-octaves': {
    label: 'Broken octaves',
    feel: 'The bass note and the octave above, back and forth.',
    beatsPerChord: 4,
  },
  rolled: {
    label: 'Rolled arpeggio',
    feel: 'A slow upward roll that keeps ringing. Each new note overlaps the ones already sounding.',
    beatsPerChord: 4,
  },
  'pop-eighths': {
    label: 'Pop eighth notes',
    feel: 'The chord on every eighth note, with the bass on 1 and 3.',
    beatsPerChord: 4,
  },
  rock: {
    label: 'Rock octaves',
    feel: 'Bass octaves on the strong beats, the chord on the offbeats.',
    beatsPerChord: 4,
  },
  hymn: {
    label: 'Hymn',
    feel: 'Long chord tones on 1 and 3, with a breath before the next chord.',
    beatsPerChord: 4,
  },
  jazz: {
    label: 'Jazz comp',
    feel: 'Bass on 1. The right hand jabs on the and of 2 and on 4.',
    beatsPerChord: 4,
  },
  gospel: {
    label: 'Gospel chops',
    feel: 'Bass on 1, then the chord pushes every offbeat.',
    beatsPerChord: 4,
  },
  bossa: {
    label: 'Bossa nova',
    feel: 'Bass on 1, a quiet chord just after 2, and the fifth of the bass on 4.',
    beatsPerChord: 4,
  },
  march: {
    label: 'March',
    feel: 'A clipped bass, chord, bass, chord. The notes are short.',
    beatsPerChord: 4,
  },
  tremolo: {
    label: 'Tremolo',
    feel: 'The bass holds. Two right-hand notes tremble back and forth.',
    beatsPerChord: 4,
  },
  tresillo: {
    label: '3+3+2 ballad',
    feel: 'Long, long, short: the chord lands on 1, the and of 2, and 4.',
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
  part: 'bass' | 'rh-all' | 'rh-mid' | 'rh-one' | 'rh-shell'
  arpIndex?: number
  /** Extra bass shape: octave doubles the note, fifth replaces it, walk picks a step. */
  bass?: 'root' | 'octave' | 'upper' | 'fifth' | 'swing-fifth' | 'walk'
  /** Sounding pitches already chosen for this hit. */
  midis?: number[]
  velocity?: number
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
    const next = voiced[(chordIndex + 1) % voiced.length]
    const hits = accompanimentHits(input.accompaniment, chord, next, instance)
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
          velocity: hit.velocity ?? (hit.part === 'bass' ? 0.92 : 0.76),
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

function accompanimentHits(id: AccompanimentId, chord: VoicedChord, next: VoicedChord, bar: number): Hit[] {
  const beats = beatsPerChord(id)
  const rhCount = chord.rhMidis.length
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
  if (id === 'swing') return swingHits()
  if (id === 'boogie') return boogieHits(chord)
  if (id === 'jump') return jumpHits(chord)
  if (id === 'bebop') return bebopHits(chord, next, bar)
  if (id === 'arpeggio') return gridHits(0.5, beats, arpCycle(rhCount), 0.42, false)
  if (id === 'alberti') return gridHits(0.5, beats, albertiCycle(rhCount), 0.4, true)
  if (id === 'waltz') {
    return [
      { beat: 0, dur: 0.9, part: 'bass' },
      { beat: 1, dur: 0.85, part: 'rh-all' },
      { beat: 2, dur: 0.85, part: 'rh-all' },
    ]
  }
  if (id === 'ballad') {
    return [
      { beat: 0, dur: 1.85, part: 'bass' },
      { beat: 2, dur: 1.85, part: 'bass' },
      ...gridHits(0.5, beats, rollCycle(rhCount), 0.4, false),
    ]
  }
  if (id === 'stride') {
    return [
      { beat: 0, dur: 0.9, part: 'bass' },
      { beat: 1, dur: 0.85, part: 'rh-all' },
      { beat: 2, dur: 0.9, part: 'bass', bass: 'fifth' },
      { beat: 3, dur: 0.85, part: 'rh-all' },
    ]
  }
  if (id === 'walking') {
    return [0, 1, 2, 3].map((beat) => ({ beat, dur: 0.92, part: 'bass' as const, bass: 'walk' as const, arpIndex: beat }))
  }
  if (id === 'pedal') {
    return [
      { beat: 0, dur: beats, part: 'bass' },
      { beat: 1, dur: 0.75, part: 'rh-all' },
      { beat: 3, dur: 0.75, part: 'rh-all' },
    ]
  }
  if (id === 'broken-octaves') {
    return [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((beat, index) => ({
      beat,
      dur: 0.42,
      part: 'bass' as const,
      bass: index % 2 === 0 ? 'root' : 'upper',
    }))
  }
  if (id === 'rolled') {
    const hits: Hit[] = [{ beat: 0, dur: beats, part: 'bass' }]
    const count = Math.max(rhCount, 1)
    for (let index = 0; index < count; index += 1) {
      const beat = 0.4 * (index + 1)
      hits.push({ beat, dur: beats - beat, part: 'rh-one', arpIndex: index })
    }
    return hits
  }
  if (id === 'pop-eighths') {
    const hits: Hit[] = [
      { beat: 0, dur: 0.35, part: 'bass' },
      { beat: 2, dur: 0.35, part: 'bass' },
    ]
    for (let beat = 0; beat < beats; beat += 0.5) hits.push({ beat, dur: 0.28, part: 'rh-all' })
    return hits
  }
  if (id === 'rock') {
    return [
      { beat: 0, dur: 0.4, part: 'bass', bass: 'octave' },
      { beat: 0.5, dur: 0.4, part: 'rh-all' },
      { beat: 1.5, dur: 0.4, part: 'rh-all' },
      { beat: 2, dur: 0.4, part: 'bass', bass: 'octave' },
      { beat: 2.5, dur: 0.4, part: 'rh-all' },
      { beat: 3.5, dur: 0.4, part: 'rh-all' },
    ]
  }
  if (id === 'hymn') {
    return [0, 2].flatMap((beat) => [
      { beat, dur: 1.55, part: 'bass' as const },
      { beat, dur: 1.55, part: 'rh-all' as const },
    ])
  }
  if (id === 'jazz') {
    return [
      { beat: 0, dur: 0.55, part: 'bass' },
      { beat: 1.5, dur: 0.4, part: 'rh-all' },
      { beat: 3, dur: 0.7, part: 'rh-all' },
    ]
  }
  if (id === 'gospel') {
    return [
      { beat: 0, dur: 0.9, part: 'bass' },
      { beat: 0.5, dur: 0.4, part: 'rh-all' },
      { beat: 1.5, dur: 0.4, part: 'rh-all' },
      { beat: 2.5, dur: 0.4, part: 'rh-all' },
      { beat: 3.5, dur: 0.35, part: 'rh-all' },
    ]
  }
  if (id === 'bossa') {
    return [
      { beat: 0, dur: 0.4, part: 'bass' },
      { beat: 1.5, dur: 0.4, part: 'rh-all' },
      { beat: 3, dur: 0.45, part: 'bass', bass: 'fifth' },
    ]
  }
  if (id === 'march') {
    return [
      { beat: 0, dur: 0.28, part: 'bass' },
      { beat: 1, dur: 0.28, part: 'rh-all' },
      { beat: 2, dur: 0.28, part: 'bass' },
      { beat: 3, dur: 0.28, part: 'rh-all' },
    ]
  }
  if (id === 'tremolo') {
    const top = Math.min(1, Math.max(rhCount - 1, 0))
    const hits: Hit[] = [{ beat: 0, dur: beats, part: 'bass' }]
    for (let index = 0; index < 8; index += 1) {
      hits.push({ beat: index * 0.5, dur: 0.42, part: 'rh-one', arpIndex: index % 2 === 0 ? 0 : top })
    }
    return hits
  }
  return [
    { beat: 0, dur: 1.15, part: 'bass' },
    { beat: 0, dur: 1.15, part: 'rh-all' },
    { beat: 1.5, dur: 1.15, part: 'rh-all' },
    { beat: 3, dur: 0.85, part: 'rh-all' },
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

const SWING_LONG = 2 / 3
const SWING_SHORT = 1 / 3

function swingHits(): Hit[] {
  return [0, 2].flatMap((beat) => [
    { beat, dur: SWING_LONG, part: 'bass' as const, bass: beat === 0 ? 'root' : 'swing-fifth' },
    { beat: beat + SWING_LONG, dur: SWING_SHORT, part: 'rh-mid' as const },
  ])
}

function midisFor(hit: Hit, chord: VoicedChord): number[] {
  if (hit.midis) return hit.midis
  if (hit.part === 'bass') return bassMidis(hit, chord)
  if (hit.part === 'rh-all') return [...chord.rhMidis]
  if (hit.part === 'rh-mid') return midChord(chord)
  if (chord.rhMidis.length === 0) return []
  return [chord.rhMidis[(hit.arpIndex ?? 0) % chord.rhMidis.length]]
}

function midChord(chord: VoicedChord): number[] {
  const notes = [...chord.rhMidis].sort((left, right) => left - right)
  return notes.slice(0, Math.min(3, notes.length))
}

function bassMidis(hit: Hit, chord: VoicedChord): number[] {
  const root = chord.bassMidi
  if (hit.bass === 'octave') return [root, Math.min(root + 12, 76)]
  if (hit.bass === 'upper') return [Math.min(root + 12, 76)]
  if (hit.bass === 'fifth') return [Math.min(root + 7, 70)]
  if (hit.bass === 'swing-fifth') return [swingFifth(chord)]
  if (hit.bass === 'walk') return [walkMidi(chord, hit.arpIndex ?? 0)]
  return [root]
}

function walkMidi(chord: VoicedChord, step: number): number {
  const root = chord.bassMidi
  if (step === 0) return root
  if (step === 2) return Math.min(root + 7, 70)
  if (step === 3) return Math.min(root + 10, 72)
  const third = chord.rhMidis.find((midi) => mod12(midi) !== mod12(root))
  const thirdPc = third == null ? mod12(root + 4) : mod12(third)
  let midi = root + ((thirdPc - mod12(root) + 12) % 12)
  if (midi <= root) midi += 12
  return Math.min(midi, 72)
}

function swingFifth(chord: VoicedChord): number {
  const root = chord.bassMidi
  const fifthPc = mod12(root + 7)
  const hasPerfectFifth = chord.chord.tones.some((tone) => mod12(tone.pc) === fifthPc)
  if (!hasPerfectFifth || root + 7 > 70) return root
  return root + 7
}

function mod12(midi: number): number {
  return ((midi % 12) + 12) % 12
}

const MINOR_WALK = new Set(['min', 'min6', 'min7', 'min9', 'min11', 'min13', 'm7b5', 'dim', 'dim7'])

function patternRoot(chord: VoicedChord): number {
  return 36 + mod12(chord.chord.root.pc)
}

function boogieThird(chord: VoicedChord): number {
  return MINOR_WALK.has(chord.chord.quality) ? 3 : 4
}

function swingEighthTimes(): number[] {
  const times: number[] = []
  for (let beat = 0; beat < 4; beat += 1) times.push(beat, beat + SWING_LONG)
  return times
}

function boogieHits(chord: VoicedChord): Hit[] {
  const root = patternRoot(chord)
  const third = boogieThird(chord)
  const steps = [0, third, 7, 9, 10, 9, 7, third]
  const times = swingEighthTimes()
  const hits: Hit[] = times.map((beat, index) => ({
    beat,
    dur: (times[index + 1] ?? 4) - beat,
    part: 'bass' as const,
    midis: [root + steps[index]],
  }))
  for (const beat of [1 + SWING_LONG, 3 + SWING_LONG]) {
    hits.push({ beat, dur: 0.22, part: 'rh-mid', velocity: 0.48 })
  }
  return hits
}

function jumpHits(chord: VoicedChord): Hit[] {
  const root = patternRoot(chord)
  const times = swingEighthTimes()
  const hits: Hit[] = times.map((beat, index) => {
    const color = index === times.length - 1 ? 10 : index % 2 === 0 ? 7 : 9
    return {
      beat,
      dur: (times[index + 1] ?? 4) - beat,
      part: 'bass' as const,
      midis: [root, root + color],
    }
  })
  for (const beat of [1, 3]) {
    hits.push({ beat, dur: 0.22, part: 'rh-mid', velocity: 0.84 })
  }
  return hits
}

function bebopHits(chord: VoicedChord, next: VoicedChord, bar: number): Hit[] {
  const root = patternRoot(chord)
  const third = root + boogieThird(chord)
  const fifth = root + 7
  const approach = nearestPc(mod12(patternRoot(next) - 1), fifth)
  const bass = [root, third, fifth, approach]
  const hits: Hit[] = bass.map((midi, beat) => ({
    beat,
    dur: 0.9,
    part: 'bass' as const,
    midis: [midi],
  }))
  const comps = bar % 2 === 0 ? [SWING_LONG, 2] : [1 + SWING_LONG, 3 + SWING_LONG]
  for (const beat of comps) {
    hits.push({ beat, dur: 0.22, part: 'rh-shell', midis: shellMidis(chord), velocity: 0.62 })
  }
  return hits
}

function shellMidis(chord: VoicedChord): number[] {
  const third = degreeMidi(chord, '3rd', 64) ?? degreeMidi(chord, '4th', 65)
  const seventh = degreeMidi(chord, '7th', 70)
  const fifth = degreeMidi(chord, '5th', 67)
  const notes: number[] = []
  if (third != null) notes.push(third)
  if (seventh != null) notes.push(seventh)
  else if (fifth != null) notes.push(fifth)
  const quality = chord.chord.quality
  if (quality === 'dom13' || quality === 'maj13' || quality === 'min13') {
    const thirteenth = degreeMidi(chord, '13th', 74)
    if (thirteenth != null) notes.push(thirteenth)
  } else if (quality === 'dom9' || quality === 'maj9' || quality === 'min9' || quality === 'dom11' || quality === 'min11') {
    const ninth = degreeMidi(chord, '9th', 72)
    if (ninth != null) notes.push(ninth)
  }
  if (notes.length === 0) return midChord(chord)
  return [...new Set(notes)].sort((left, right) => left - right)
}

function degreeMidi(chord: VoicedChord, label: string, center: number): number | null {
  const tone = chord.chord.tones.find((item) => item.degreeLabel === label)
  if (!tone) return null
  return nearestPc(tone.pc, center)
}

function nearestPc(pc: number, near: number): number {
  const base = near - mod12(near - pc)
  const options = [base - 12, base, base + 12]
  return options.reduce((best, midi) => (Math.abs(midi - near) < Math.abs(best - near) ? midi : best))
}
