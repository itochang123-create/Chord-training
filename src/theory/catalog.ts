import type { Mode } from './pitch.ts'

export const EDITORIAL_NOTE =
  'Order is an editorial starting point for Mandopop familiarity, not a measured frequency chart.'

export const COLOR_NOTE =
  'Diminished chords are often passing or leading-tone colors. A suspended chord usually resolves. Those qualities sit on the chords that use them, not on every chord in the loop. The color examples below are illustrations, not frequency claims.'

export type Preset = {
  id: string
  title: string
  formula: string
  nickname: string | null
  mode: Mode
  blurb: string
  /** Color examples are written per chord. They are not a global recoloring. */
  example?: 'color'
}

export const PRESETS: Preset[] = [
  {
    id: '1645',
    title: 'I–vi–IV–V',
    formula: 'I–vi–IV–V',
    nickname: '1645 · 1 6 4 5',
    mode: 'major',
    blurb: '1645 is C–Am–F–G. It is I–vi–IV–V, not 1564.',
  },
  {
    id: 'descending-bass',
    title: 'Descending bass · C–B–A–G–F–E–D–G',
    formula: 'I–V6–vi–iii6–IV–I6–ii–V',
    nickname: 'Canon · 卡農',
    mode: 'major',
    blurb:
      'Descending bass, the Canon line. The bass walks C–B–A–G–F–E–D, then G. The chords are C–G/B–Am–Em/G–F–C/E–Dm–G.',
  },
  {
    id: '6415',
    title: 'vi–IV–I–V',
    formula: 'vi–IV–I–V',
    nickname: '6415',
    mode: 'major',
    blurb: 'The four-chord loop under a lot of Mandopop ballads. In C it is Am–F–C–G.',
  },
  {
    id: '1564',
    title: 'I–V–vi–IV',
    formula: 'I–V–vi–IV',
    nickname: '1564',
    mode: 'major',
    blurb: 'The same four chords, starting on the tonic. 1564 is I–V–vi–IV, not I–vi–IV–V.',
  },
  {
    id: 'royal',
    title: 'IV–V–iii–vi',
    formula: 'IV–V–iii–vi',
    nickname: 'Royal Road',
    mode: 'major',
    blurb: 'The Royal Road. In C it is F–G–Em–Am, a ballad shape shared across Mandopop and J-pop.',
  },
  {
    id: 'canon',
    title: 'I–V–vi–iii–IV–I–IV–V',
    formula: 'I–V–vi–iii–IV–I–IV–V',
    nickname: 'Canon, roots',
    mode: 'major',
    blurb: 'Pachelbel’s Canon in root position. The bass does not walk down; that line is the descending-bass preset.',
  },
  {
    id: 'royal-long',
    title: 'IV–V–iii–vi–ii–V–I',
    formula: 'IV–V–iii–vi–ii–V–I',
    nickname: 'Royal Road, longer',
    mode: 'major',
    blurb: 'The Royal Road continued through ii–V–I until it lands on the tonic.',
  },
  {
    id: 'komuro',
    title: 'vi–IV–V–I',
    formula: 'vi–IV–V–I',
    nickname: 'Komuro',
    mode: 'major',
    blurb: 'The Komuro cadence: vi–IV–V–I. A dance-pop turn into the tonic.',
  },
  {
    id: '251',
    title: 'ii–V–I',
    formula: 'ii–V–I',
    nickname: 'ii–V–I',
    mode: 'major',
    blurb: 'The basic turnaround. In C it is Dm–G–C.',
  },
  {
    id: '145',
    title: 'I–IV–V',
    formula: 'I–IV–V',
    nickname: null,
    mode: 'major',
    blurb: 'Primary triads only, when you want I, IV, and V to feel obvious.',
  },
  {
    id: 'bass-walk',
    title: 'vi–IV–I–V6',
    formula: 'vi–IV–I–V6',
    nickname: '6415 · V in first inversion',
    mode: 'major',
    blurb: 'In C this is Am–F–C–G/B. G/B is G with B in the bass: first inversion, because B is the 3rd.',
  },
  {
    id: 'minor-pop',
    title: 'i–VI–III–VII',
    formula: 'i–VI–III–VII',
    nickname: null,
    mode: 'minor',
    blurb: 'The minor pop loop in C minor: Cm–A♭–E♭–B♭. Home is the minor tonic.',
  },
  {
    id: 'minor-descent',
    title: 'i–VII–VI–VII',
    formula: 'i–VII–VI–VII',
    nickname: null,
    mode: 'minor',
    blurb: 'A minor line that keeps touching the flat VII. In C minor: Cm–B♭–A♭–B♭.',
  },
  {
    id: 'minor-cadence',
    title: 'i–iv–V–i',
    formula: 'i–iv–V–i',
    nickname: null,
    mode: 'minor',
    blurb: 'Minor i, minor iv, major V. The uppercase V is the raised leading tone. In C minor: Cm–Fm–G–Cm.',
  },
  {
    id: 'minor-turn',
    title: 'i–VI–iv–V',
    formula: 'i–VI–iv–V',
    nickname: null,
    mode: 'minor',
    blurb: 'A minor phrase that still resolves with a major V. In C minor: Cm–A♭–Fm–G.',
  },
  {
    id: 'minor-251',
    title: 'iiø–V–i',
    formula: 'iiø–V–i',
    nickname: 'minor ii–V–i',
    mode: 'minor',
    blurb: 'Half-diminished ii, major V, minor i. In C minor: Dm7♭5–G–Cm. The color is only on ii.',
  },
  {
    id: 'color-ii-v-i',
    title: 'ii9–V13–Imaj9',
    formula: 'ii9–V13–Imaj9',
    nickname: 'Color example',
    mode: 'major',
    example: 'color',
    blurb: 'Color example, not a frequency claim. In C: Dm9–G13–Cmaj9. The 13th is only on V.',
  },
  {
    id: 'color-passing-dim',
    title: 'I–#I°7–ii7–V7',
    formula: 'I #I°7 ii7 V7',
    nickname: 'Color example',
    mode: 'major',
    example: 'color',
    blurb: 'Color example, not a frequency claim. In C: C–C#dim7–Dm7–G7. The dim7 is the passing chord.',
  },
  {
    id: 'color-sus',
    title: 'V7sus4–V7–Imaj7',
    formula: 'V7sus4–V7–Imaj7',
    nickname: 'Color example',
    mode: 'major',
    example: 'color',
    blurb: 'Color example, not a frequency claim. In C: G7sus4–G7–Cmaj7. The sus4 resolves; it is not on I.',
  },
  {
    id: 'color-turnaround',
    title: 'Imaj7–vi7–ii7–V7',
    formula: 'Imaj7–vi7–ii7–V7',
    nickname: 'Color example',
    mode: 'major',
    example: 'color',
    blurb: 'Color example, not a frequency claim. Each chord keeps its own 7th: major 7 on I, minor 7s, dominant 7 on V.',
  },
]

export function presetById(id: string): Preset | undefined {
  return PRESETS.find((preset) => preset.id === id)
}
