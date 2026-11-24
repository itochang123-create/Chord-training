import {
  locateDegree,
  mod,
  noteWithOctave,
  romanNumeral,
  spellInKey,
  spellInterval,
  type Degree,
  type Key,
  type Spelled,
} from './pitch.ts'

export type QualityId =
  | 'maj'
  | 'min'
  | 'dim'
  | 'aug'
  | 'dom7'
  | 'maj7'
  | 'min7'
  | 'dim7'
  | 'm7b5'
  | 'maj6'
  | 'min6'
  | 'dom9'
  | 'maj9'
  | 'min9'
  | 'dom11'
  | 'min11'
  | 'dom13'
  | 'maj13'
  | 'min13'
  | 'dom7sus4'
  | 'sus2'
  | 'sus4'

export type Tone = Spelled & { degreeLabel: string }

type IntervalSpec = { semitones: number; letterSkip: number; degreeLabel: string }

const INTERVALS: Record<QualityId, IntervalSpec[]> = {
  maj: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 4, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
  ],
  min: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 3, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
  ],
  dim: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 3, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 6, letterSkip: 4, degreeLabel: '5th' },
  ],
  aug: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 4, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 8, letterSkip: 4, degreeLabel: '5th' },
  ],
  dom7: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 4, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
    { semitones: 10, letterSkip: 6, degreeLabel: '7th' },
  ],
  maj7: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 4, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
    { semitones: 11, letterSkip: 6, degreeLabel: '7th' },
  ],
  min7: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 3, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
    { semitones: 10, letterSkip: 6, degreeLabel: '7th' },
  ],
  dim7: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 3, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 6, letterSkip: 4, degreeLabel: '5th' },
    { semitones: 9, letterSkip: 6, degreeLabel: '7th' },
  ],
  m7b5: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 3, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 6, letterSkip: 4, degreeLabel: '5th' },
    { semitones: 10, letterSkip: 6, degreeLabel: '7th' },
  ],
  maj6: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 4, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
    { semitones: 9, letterSkip: 5, degreeLabel: '6th' },
  ],
  min6: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 3, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
    { semitones: 9, letterSkip: 5, degreeLabel: '6th' },
  ],
  dom9: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 4, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
    { semitones: 10, letterSkip: 6, degreeLabel: '7th' },
    { semitones: 14, letterSkip: 8, degreeLabel: '9th' },
  ],
  maj9: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 4, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
    { semitones: 11, letterSkip: 6, degreeLabel: '7th' },
    { semitones: 14, letterSkip: 8, degreeLabel: '9th' },
  ],
  min9: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 3, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
    { semitones: 10, letterSkip: 6, degreeLabel: '7th' },
    { semitones: 14, letterSkip: 8, degreeLabel: '9th' },
  ],
  dom11: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 4, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
    { semitones: 10, letterSkip: 6, degreeLabel: '7th' },
    { semitones: 14, letterSkip: 8, degreeLabel: '9th' },
    { semitones: 17, letterSkip: 10, degreeLabel: '11th' },
  ],
  min11: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 3, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
    { semitones: 10, letterSkip: 6, degreeLabel: '7th' },
    { semitones: 14, letterSkip: 8, degreeLabel: '9th' },
    { semitones: 17, letterSkip: 10, degreeLabel: '11th' },
  ],
  sus2: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 2, letterSkip: 1, degreeLabel: '2nd' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
  ],
  sus4: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 5, letterSkip: 3, degreeLabel: '4th' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
  ],
  dom13: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 4, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
    { semitones: 10, letterSkip: 6, degreeLabel: '7th' },
    { semitones: 14, letterSkip: 8, degreeLabel: '9th' },
    { semitones: 21, letterSkip: 12, degreeLabel: '13th' },
  ],
  maj13: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 4, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
    { semitones: 11, letterSkip: 6, degreeLabel: '7th' },
    { semitones: 14, letterSkip: 8, degreeLabel: '9th' },
    { semitones: 21, letterSkip: 12, degreeLabel: '13th' },
  ],
  min13: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 3, letterSkip: 2, degreeLabel: '3rd' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
    { semitones: 10, letterSkip: 6, degreeLabel: '7th' },
    { semitones: 14, letterSkip: 8, degreeLabel: '9th' },
    { semitones: 21, letterSkip: 12, degreeLabel: '13th' },
  ],
  dom7sus4: [
    { semitones: 0, letterSkip: 0, degreeLabel: 'root' },
    { semitones: 5, letterSkip: 3, degreeLabel: '4th' },
    { semitones: 7, letterSkip: 4, degreeLabel: '5th' },
    { semitones: 10, letterSkip: 6, degreeLabel: '7th' },
  ],
}

const SYMBOL_SUFFIX: Record<QualityId, string> = {
  maj: '',
  min: 'm',
  dim: 'dim',
  aug: 'aug',
  dom7: '7',
  maj7: 'maj7',
  min7: 'm7',
  dim7: 'dim7',
  m7b5: 'm7b5',
  maj6: '6',
  min6: 'm6',
  dom9: '9',
  maj9: 'maj9',
  min9: 'm9',
  dom11: '11',
  min11: 'm11',
  dom13: '13',
  maj13: 'maj13',
  min13: 'm13',
  dom7sus4: '7sus4',
  sus2: 'sus2',
  sus4: 'sus4',
}

export const QUALITY_OPTIONS: { id: QualityId; label: string }[] = [
  { id: 'maj', label: 'Major' },
  { id: 'min', label: 'Minor' },
  { id: 'maj6', label: '6' },
  { id: 'min6', label: 'm6' },
  { id: 'dom7', label: '7' },
  { id: 'maj7', label: 'maj7' },
  { id: 'min7', label: 'm7' },
  { id: 'dom9', label: '9' },
  { id: 'maj9', label: 'maj9' },
  { id: 'min9', label: 'm9' },
  { id: 'dom11', label: '11' },
  { id: 'min11', label: 'm11' },
  { id: 'dom13', label: '13' },
  { id: 'maj13', label: 'maj13' },
  { id: 'min13', label: 'm13' },
  { id: 'dim', label: 'dim' },
  { id: 'dim7', label: 'dim7' },
  { id: 'm7b5', label: 'm7b5' },
  { id: 'sus2', label: 'sus2' },
  { id: 'sus4', label: 'sus4' },
  { id: 'dom7sus4', label: '7sus4' },
  { id: 'aug', label: 'aug' },
]

export function formatChordSymbol(rootName: string, quality: QualityId, bassName: string | null): string {
  const head = rootName + SYMBOL_SUFFIX[quality]
  if (!bassName || bassName === rootName) return head
  return `${head}/${bassName}`
}

const LOWER_QUALITIES = new Set<QualityId>([
  'min',
  'min7',
  'min9',
  'min11',
  'min13',
  'min6',
  'dim',
  'dim7',
  'm7b5',
])

const INVERSION_DEGREE: Record<string, 1 | 2 | 3> = {
  '3rd': 1,
  '5th': 2,
  '7th': 3,
}

export type BassRole =
  | { kind: 'root' }
  | { kind: 'inversion'; inversion: 1 | 2 | 3; degreeLabel: string }
  | { kind: 'chord-tone'; degreeLabel: string }
  | { kind: 'non-chord' }

export type ResolvedChord = {
  symbol: string
  roman: string
  root: Spelled
  bass: Spelled
  quality: QualityId
  tones: Tone[]
  bassRole: BassRole
  omission: string | null
}

export const VOICING_OMISSION_SUMMARY =
  'Triads, 6ths, sus chords, and 7ths sound every chord tone. 9ths and 13ths leave out the 5th. A dominant 13 keeps the flat 7th, so it is not a 6th chord. 11ths leave out the 3rd and the 5th. A slash bass is still played when the right hand omits that pitch.'

export function chordTones(root: Spelled, quality: QualityId): Tone[] {
  return INTERVALS[quality].map((interval) => {
    const spelled = spellInterval(root, interval.semitones, interval.letterSkip)
    return { ...spelled, degreeLabel: interval.degreeLabel }
  })
}

export function theoreticalPcs(chord: ResolvedChord): number[] {
  return [...new Set(chord.tones.map((tone) => tone.pc))].sort((a, b) => a - b)
}

export function classifyBass(tones: Tone[], bass: Spelled): BassRole {
  if (bass.pc === tones[0]?.pc) return { kind: 'root' }
  const match = tones.find((tone) => tone.pc === bass.pc)
  if (!match) return { kind: 'non-chord' }
  const inversion = INVERSION_DEGREE[match.degreeLabel]
  if (inversion) return { kind: 'inversion', inversion, degreeLabel: match.degreeLabel }
  return { kind: 'chord-tone', degreeLabel: match.degreeLabel }
}

export function resolveBassSpelling(tones: Tone[], bass: Spelled): Spelled {
  return tones.find((tone) => tone.pc === bass.pc) ?? bass
}

export function buildSymbol(root: Spelled, quality: QualityId, bass: Spelled): string {
  const head = root.name + SYMBOL_SUFFIX[quality]
  if (bass.pc === root.pc) return head
  return `${head}/${bass.name}`
}

function romanSuffix(quality: QualityId): string {
  switch (quality) {
    case 'maj':
    case 'min':
      return ''
    case 'dim':
      return '°'
    case 'aug':
      return '+'
    case 'dom7':
    case 'min7':
      return '7'
    case 'maj7':
      return 'maj7'
    case 'dim7':
      return '°7'
    case 'm7b5':
      return 'ø'
    case 'maj6':
    case 'min6':
      return 'add6'
    case 'dom9':
    case 'min9':
      return '9'
    case 'maj9':
      return 'maj9'
    case 'dom11':
    case 'min11':
      return '11'
    case 'dom13':
    case 'min13':
      return '13'
    case 'maj13':
      return 'maj13'
    case 'dom7sus4':
      return '7sus4'
    case 'sus2':
      return 'sus2'
    case 'sus4':
      return 'sus4'
  }
}

function figureFor(quality: QualityId, role: BassRole): string {
  if (role.kind !== 'inversion') return ''
  const triad = quality === 'maj' || quality === 'min' || quality === 'dim' || quality === 'aug'
  const seventh = quality === 'dom7' || quality === 'min7' || quality === 'dim7'
  if (triad && role.inversion === 1) return '6'
  if (triad && role.inversion === 2) return '64'
  if (seventh && role.inversion === 1) return '65'
  if (seventh && role.inversion === 2) return '43'
  if (seventh && role.inversion === 3) return '42'
  return ''
}

export function buildRoman(root: Spelled, quality: QualityId, role: BassRole, key: Key): string {
  const located = locateDegree(root, key)
  const base = romanNumeral(located.degree, !LOWER_QUALITIES.has(quality), located.alteration)
  const figure = figureFor(quality, role)
  if (figure === '65' || figure === '43' || figure === '42') return base + figure
  return base + romanSuffix(quality) + figure
}

const NINTHS = new Set<QualityId>(['dom9', 'maj9', 'min9', 'dom11', 'min11', 'dom13', 'maj13', 'min13'])

export function omissionText(quality: QualityId, role: BassRole): string | null {
  if (!NINTHS.has(quality)) return null
  const parts: string[] = []
  if (quality === 'dom11' || quality === 'min11') {
    parts.push(
      role.kind === 'inversion' && role.degreeLabel === '3rd'
        ? 'The right hand leaves out the 3rd so it does not clash with the 11th. The bass still plays the 3rd, because the slash bass asks for it.'
        : 'The sounded voicing leaves out the 3rd so it does not clash a minor ninth against the 11th. The 3rd is still a theoretical chord tone.',
    )
  }
  if (quality === 'dom13') {
    parts.push('The flat 7th stays in the sounded chord, so C13 is not C6.')
  }
  parts.push(
    role.kind === 'inversion' && role.degreeLabel === '5th'
      ? 'The right hand leaves out the 5th. The bass still plays it.'
      : 'The sounded voicing leaves out the 5th.',
  )
  return parts.join(' ')
}

export function realize(root: Spelled, quality: QualityId, bass: Spelled, key: Key): ResolvedChord {
  const tones = chordTones(root, quality)
  const spelledBass = resolveBassSpelling(tones, bass)
  const bassRole = classifyBass(tones, spelledBass)
  return {
    symbol: buildSymbol(root, quality, spelledBass),
    roman: buildRoman(root, quality, bassRole, key),
    root,
    bass: spelledBass,
    quality,
    tones,
    bassRole,
    omission: omissionText(quality, bassRole),
  }
}

export function reanalyze(chord: ResolvedChord, key: Key): ResolvedChord {
  return realize(chord.root, chord.quality, chord.bass, key)
}

export function transposeResolved(chord: ResolvedChord, delta: number, dest: Key): ResolvedChord {
  const root = spellInKey(mod(chord.root.pc + delta), dest)
  let bass: Spelled
  if (chord.bassRole.kind === 'non-chord') {
    bass = spellInKey(mod(chord.bass.pc + delta), dest)
  } else if (chord.bassRole.kind === 'root') {
    bass = root
  } else {
    const label = chord.bassRole.degreeLabel
    bass = chordTones(root, chord.quality).find((tone) => tone.degreeLabel === label) ?? root
  }
  return realize(root, chord.quality, bass, dest)
}

function omittedFromRightHand(tone: Tone, quality: QualityId): boolean {
  if ((quality === 'dom11' || quality === 'min11') && tone.degreeLabel === '3rd') return true
  if (NINTHS.has(quality) && tone.degreeLabel === '5th') return true
  return false
}

export function rightHandTones(chord: ResolvedChord): Tone[] {
  return chord.tones.filter((tone) => !omittedFromRightHand(tone, chord.quality))
}

export type RhVoicing = 'root' | 'first' | 'second' | 'smooth'

export type SoundingNote = {
  midi: number
  name: string
  role: 'bass' | 'rh'
  degreeLabel: string
}

export type VoicedChord = {
  chord: ResolvedChord
  bassMidi: number
  rhMidis: number[]
  rhLabel: string
  sounding: SoundingNote[]
}

const BASS_LOW = 40
const BASS_HIGH = 59
const RH_BOTTOM_MIN = 60
const RH_BOTTOM_MAX = 67
const RH_ABS_MIN = 60
const RH_ABS_MAX = 86

function pcsInRange(pc: number, low: number, high: number): number[] {
  const found: number[] = []
  for (let midi = low; midi <= high; midi += 1) {
    if (mod(midi) === mod(pc)) found.push(midi)
  }
  return found
}

export function placeBass(pc: number, previous: number | null): number {
  const options = pcsInRange(pc, BASS_LOW, BASS_HIGH)
  if (options.length === 0) return 48 + mod(pc)
  if (previous == null) {
    return options.reduce((best, midi) => {
      const distance = Math.abs(midi - 53)
      const bestDistance = Math.abs(best - 53)
      if (distance < bestDistance) return midi
      if (distance === bestDistance) return Math.max(best, midi)
      return best
    })
  }
  return options.reduce((best, midi) => (Math.abs(midi - previous) < Math.abs(best - previous) ? midi : best))
}

function stackClose(tones: Tone[], rotation: number, bottomMidi: number): number[] {
  const count = tones.length
  const turn = ((rotation % count) + count) % count
  const ordered = [...tones.slice(turn), ...tones.slice(0, turn)]
  const midis = [bottomMidi]
  for (let index = 1; index < ordered.length; index += 1) {
    let next = midis[index - 1] + 1
    while (mod(next) !== ordered[index].pc) next += 1
    midis.push(next)
  }
  return midis
}

function voiceFixed(tones: Tone[], rotation: number): number[] {
  const count = tones.length
  const turn = ((rotation % count) + count) % count
  const bottomPc = tones[turn].pc
  let best: number[] | null = null
  let bestScore = Number.POSITIVE_INFINITY
  for (const bottom of pcsInRange(bottomPc, RH_BOTTOM_MIN, RH_BOTTOM_MAX)) {
    const midis = stackClose(tones, turn, bottom)
    if (midis[midis.length - 1] > RH_ABS_MAX) continue
    const average = midis.reduce((sum, midi) => sum + midi, 0) / midis.length
    const score = Math.abs(average - 67)
    if (score < bestScore) {
      bestScore = score
      best = midis
    }
  }
  if (best) return best
  const fallback = pcsInRange(bottomPc, 60, 76)[0] ?? 60
  return stackClose(tones, turn, fallback)
}

function assignmentCost(next: number[], previous: number[]): number {
  if (next.length === 0 || previous.length === 0) return 100
  if (next.length === previous.length && next.length <= 4) {
    const indexes = previous.map((_, index) => index)
    let best = Number.POSITIVE_INFINITY
    const permute = (source: number[], left: number) => {
      if (left === source.length) {
        let cost = 0
        for (let index = 0; index < next.length; index += 1) cost += Math.abs(next[index] - previous[source[index]])
        if (cost < best) best = cost
        return
      }
      for (let index = left; index < source.length; index += 1) {
        const swap = source[left]
        source[left] = source[index]
        source[index] = swap
        permute(source, left + 1)
        source[index] = source[left]
        source[left] = swap
      }
    }
    permute(indexes, 0)
    return best
  }
  const used = new Set<number>()
  let cost = 0
  for (const midi of [...next].sort((a, b) => a - b)) {
    let choice = -1
    let distance = Number.POSITIVE_INFINITY
    previous.forEach((candidate, index) => {
      if (used.has(index)) return
      const gap = Math.abs(candidate - midi)
      if (gap < distance) {
        distance = gap
        choice = index
      }
    })
    if (choice >= 0) {
      used.add(choice)
      cost += distance
    }
  }
  return cost
}

function voiceSmooth(tones: Tone[], previous: number[] | null): { midis: number[]; rotation: number } {
  if (!previous || previous.length === 0) return { midis: voiceFixed(tones, 0), rotation: 0 }
  let best: { midis: number[]; rotation: number; cost: number } | null = null
  for (const rotation of [0, 1, 2]) {
    if (rotation >= tones.length) continue
    for (const shift of [0, 12]) {
      const midis = voiceFixed(tones, rotation).map((midi) => midi + shift)
      if (midis.some((midi) => midi < RH_ABS_MIN || midi > RH_ABS_MAX)) continue
      const cost = assignmentCost(midis, previous)
      if (
        !best ||
        cost < best.cost ||
        (cost === best.cost && (midis[0] < best.midis[0] || (midis[0] === best.midis[0] && rotation < best.rotation)))
      ) {
        best = { midis, rotation, cost }
      }
    }
  }
  return best ?? { midis: voiceFixed(tones, 0), rotation: 0 }
}

function describeRightHand(mode: RhVoicing, lowest: Tone, lowestName: string): string {
  const detail = `lowest note is the ${lowest.degreeLabel} (${lowestName})`
  if (mode === 'smooth') return `Smooth voice leading · ${detail}`
  if (mode === 'root') return `Root position · ${detail}`
  if (mode === 'first') return `First inversion · ${detail}`
  return `Second inversion · ${detail}`
}

export function describeBass(chord: ResolvedChord, bassName: string): string {
  const role = chord.bassRole
  if (role.kind === 'root') return `Root position · bass ${bassName}`
  if (role.kind === 'inversion') {
    const word = role.inversion === 1 ? 'First' : role.inversion === 2 ? 'Second' : 'Third'
    return `${word} inversion · bass is the ${role.degreeLabel} (${bassName})`
  }
  if (role.kind === 'chord-tone') {
    return `Chord-tone slash bass · bass is the ${role.degreeLabel} (${bassName}), not a classical triad inversion`
  }
  return `Non-chord slash bass (${bassName})`
}

export function voiceChord(
  chord: ResolvedChord,
  mode: RhVoicing,
  previousRh: number[] | null,
  previousBass: number | null,
): Omit<VoicedChord, 'chord'> {
  const tones = rightHandTones(chord)
  const rotation = mode === 'first' ? 1 : mode === 'second' ? 2 : 0
  const capped = Math.min(rotation, Math.max(0, tones.length - 1))
  const voiced = mode === 'smooth' ? voiceSmooth(tones, previousRh) : { midis: voiceFixed(tones, capped), rotation: capped }
  const bassMidi = placeBass(chord.bass.pc, previousBass)
  const count = tones.length
  const turn = ((voiced.rotation % count) + count) % count
  const ordered = [...tones.slice(turn), ...tones.slice(0, turn)]
  const bassDegree =
    chord.bassRole.kind === 'root'
      ? 'root'
      : chord.bassRole.kind === 'non-chord'
        ? 'slash'
        : chord.bassRole.degreeLabel
  const sounding: SoundingNote[] = [
    {
      midi: bassMidi,
      name: noteWithOctave(bassMidi, chord.bass),
      role: 'bass',
      degreeLabel: bassDegree,
    },
    ...voiced.midis.map((midi, index) => ({
      midi,
      name: noteWithOctave(midi, ordered[index]),
      role: 'rh' as const,
      degreeLabel: ordered[index].degreeLabel,
    })),
  ]
  return {
    bassMidi,
    rhMidis: voiced.midis,
    rhLabel: describeRightHand(mode, ordered[0], noteWithOctave(voiced.midis[0], ordered[0])),
    sounding,
  }
}

export function voiceProgression(chords: ResolvedChord[], mode: RhVoicing): VoicedChord[] {
  const voiceAll = (previousRh: number[] | null, previousBass: number | null) => {
    const voiced: VoicedChord[] = []
    let rh = previousRh
    let bass = previousBass
    for (const chord of chords) {
      const next = voiceChord(chord, mode, rh, bass)
      voiced.push({ chord, ...next })
      rh = next.rhMidis
      bass = next.bassMidi
    }
    return voiced
  }
  if (mode === 'smooth' && chords.length > 1) {
    const preliminary = voiceAll(null, null)
    const last = preliminary[preliminary.length - 1]
    return voiceAll(last.rhMidis, last.bassMidi)
  }
  return voiceAll(null, null)
}

export function soundingPcs(voiced: VoicedChord): number[] {
  return [...new Set(voiced.sounding.map((note) => mod(note.midi)))].sort((a, b) => a - b)
}

export function joinSymbols(chords: ResolvedChord[]): string {
  return chords.map((chord) => chord.symbol).join('–')
}

const MAJOR_DIATONIC: QualityId[] = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']
const MINOR_DIATONIC: QualityId[] = ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj']

export function diatonicQuality(degree: Degree, mode: Key['mode']): QualityId {
  return (mode === 'major' ? MAJOR_DIATONIC : MINOR_DIATONIC)[degree - 1]
}
