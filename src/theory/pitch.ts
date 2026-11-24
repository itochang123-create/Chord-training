export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
export type Letter = (typeof LETTERS)[number]
export type Accidental = -2 | -1 | 0 | 1 | 2
export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type Mode = 'major' | 'minor'

export const NATURAL_PC: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

export type Spelled = {
  letter: Letter
  accidental: Accidental
  pc: number
  name: string
}

export type Key = {
  tonic: Spelled
  mode: Mode
  /** Accidental style of the key signature. C major / A minor is natural. */
  signature: 'sharp' | 'flat' | 'natural'
}

export const TONIC_NAMES = [
  'C',
  'C#',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const

export type TonicName = (typeof TONIC_NAMES)[number]

const TONIC_SPELLING: Record<TonicName, { letter: Letter; accidental: Accidental }> = {
  C: { letter: 'C', accidental: 0 },
  'C#': { letter: 'C', accidental: 1 },
  Db: { letter: 'D', accidental: -1 },
  D: { letter: 'D', accidental: 0 },
  Eb: { letter: 'E', accidental: -1 },
  E: { letter: 'E', accidental: 0 },
  F: { letter: 'F', accidental: 0 },
  'F#': { letter: 'F', accidental: 1 },
  Gb: { letter: 'G', accidental: -1 },
  G: { letter: 'G', accidental: 0 },
  Ab: { letter: 'A', accidental: -1 },
  A: { letter: 'A', accidental: 0 },
  Bb: { letter: 'B', accidental: -1 },
  B: { letter: 'B', accidental: 0 },
}

const SHARP_MAJORS = new Set(['G', 'D', 'A', 'E', 'B', 'F#', 'C#'])
const FLAT_MAJORS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'])
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11]
const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10]

export function mod(n: number): number {
  return ((n % 12) + 12) % 12
}

export function accidentalString(accidental: Accidental): string {
  if (accidental === 0) return ''
  if (accidental === 1) return '#'
  if (accidental === -1) return 'b'
  if (accidental === 2) return '##'
  return 'bb'
}

export function spell(letter: Letter, accidental: Accidental): Spelled {
  return {
    letter,
    accidental,
    pc: mod(NATURAL_PC[letter] + accidental),
    name: letter + accidentalString(accidental),
  }
}

export function parseAccidental(raw: string): Accidental | null {
  switch (raw) {
    case '':
      return 0
    case '#':
    case '♯':
      return 1
    case 'b':
    case '♭':
      return -1
    case '##':
    case '♯♯':
    case 'x':
      return 2
    case 'bb':
    case '♭♭':
      return -2
    default:
      return null
  }
}

export function spellInterval(root: Spelled, semitones: number, letterSkip: number): Spelled {
  const letter = LETTERS[(LETTERS.indexOf(root.letter) + (letterSkip % 7)) % 7]
  const target = mod(root.pc + semitones)
  let diff = mod(target - NATURAL_PC[letter])
  if (diff > 6) diff -= 12
  if (diff > 2 || diff < -2) {
    throw new Error(`Cannot spell +${semitones} from ${root.name} on ${letter} (offset ${diff})`)
  }
  return spell(letter, diff as Accidental)
}

export function isTonicName(value: string): value is TonicName {
  return (TONIC_NAMES as readonly string[]).includes(value)
}

export function makeKey(tonicName: string, mode: Mode): Key {
  if (!isTonicName(tonicName)) {
    throw new Error(`Unknown tonic ${tonicName}`)
  }
  const spec = TONIC_SPELLING[tonicName]
  const tonic = spell(spec.letter, spec.accidental)
  return { tonic, mode, signature: signatureOf(tonic, mode) }
}

function signatureOf(tonic: Spelled, mode: Mode): Key['signature'] {
  const major = mode === 'major' ? tonic : spellInterval(tonic, 3, 2)
  if (SHARP_MAJORS.has(major.name)) return 'sharp'
  if (FLAT_MAJORS.has(major.name)) return 'flat'
  if (major.name === 'C') return 'natural'
  if (major.accidental > 0) return 'sharp'
  if (major.accidental < 0) return 'flat'
  return 'natural'
}

/** Natural minor in minor keys. Degree 5 is the same pitch as in major; case and suffixes set quality. */
export function spelledScale(key: Key): Spelled[] {
  const steps = key.mode === 'major' ? MAJOR_STEPS : MINOR_STEPS
  return steps.map((semi, index) => spellInterval(key.tonic, semi, index))
}

const SHARP_SPELLING: Array<[Letter, Accidental]> = [
  ['C', 0],
  ['C', 1],
  ['D', 0],
  ['D', 1],
  ['E', 0],
  ['F', 0],
  ['F', 1],
  ['G', 0],
  ['G', 1],
  ['A', 0],
  ['A', 1],
  ['B', 0],
]

const FLAT_SPELLING: Array<[Letter, Accidental]> = [
  ['C', 0],
  ['D', -1],
  ['D', 0],
  ['E', -1],
  ['E', 0],
  ['F', 0],
  ['G', -1],
  ['G', 0],
  ['A', -1],
  ['A', 0],
  ['B', -1],
  ['B', 0],
]

export function spellPcPrefer(pc: number, prefer: 'sharp' | 'flat'): Spelled {
  const row = (prefer === 'flat' ? FLAT_SPELLING : SHARP_SPELLING)[mod(pc)]
  return spell(row[0], row[1])
}

export function spellInKey(pc: number, key: Key): Spelled {
  const diatonic = spelledScale(key).find((note) => note.pc === mod(pc))
  if (diatonic) return diatonic
  return spellPcPrefer(pc, key.signature === 'flat' ? 'flat' : 'sharp')
}

export function locateDegree(note: Spelled, key: Key): { degree: Degree; alteration: number } {
  const scale = spelledScale(key)
  let best: { degree: Degree; alteration: number; score: number } | null = null
  for (let index = 0; index < scale.length; index += 1) {
    const diatonic = scale[index]
    let alteration = mod(note.pc - diatonic.pc)
    if (alteration > 6) alteration -= 12
    if (alteration > 2 || alteration < -2) continue
    let score = alteration === 0 ? 0 : 10 + Math.abs(alteration)
    if (alteration > 0 && note.accidental < 0) score += 5
    if (alteration < 0 && note.accidental > 0) score += 5
    if (alteration === 0 && note.letter !== diatonic.letter) score += 2
    if (
      !best ||
      score < best.score ||
      (score === best.score && Math.abs(alteration) < Math.abs(best.alteration))
    ) {
      best = { degree: (index + 1) as Degree, alteration, score }
    }
  }
  if (!best) {
    throw new Error(`No scale degree for ${note.name} in ${key.tonic.name} ${key.mode}`)
  }
  return { degree: best.degree, alteration: best.alteration }
}

export function degreeToSpelled(degree: Degree, alteration: number, key: Key): Spelled {
  const diatonic = spelledScale(key)[degree - 1]
  if (alteration === 0) return diatonic
  const next = diatonic.accidental + alteration
  if (next > 2 || next < -2) {
    return spellInKey(mod(diatonic.pc + alteration), key)
  }
  return spell(diatonic.letter, next as Accidental)
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

export function alterationPrefix(alteration: number): string {
  if (alteration === -2) return 'bb'
  if (alteration === -1) return 'b'
  if (alteration === 1) return '#'
  if (alteration === 2) return '##'
  return ''
}

export function romanNumeral(degree: Degree, upper: boolean, alteration: number): string {
  const numeral = upper ? ROMAN[degree - 1] : ROMAN[degree - 1].toLowerCase()
  return alterationPrefix(alteration) + numeral
}

export function midiOctave(midi: number): number {
  return Math.floor(midi / 12) - 1
}

export function noteWithOctave(midi: number, spelled: Spelled): string {
  return `${spelled.name}${midiOctave(midi)}`
}

export function prettify(symbol: string): string {
  return symbol.replaceAll('##', '♯♯').replaceAll('bb', '♭♭').replaceAll('#', '♯').replaceAll('b', '♭')
}
