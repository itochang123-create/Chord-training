import { chordTones, diatonicQuality, type QualityId } from './chord.ts'
import type { Degree, Mode, Spelled } from './pitch.ts'

export type Triad = 'maj' | 'min' | 'dim' | 'aug'
export type Figure = '6' | '64' | '65' | '43' | '42'
export type GrammarKind = 'roman' | 'number' | 'concrete'

export type QualityParse = { quality: QualityId; figure: Figure | null }

const WORDS: Array<[string, (base: Triad) => QualityId | null]> = [
  ['7sus4', () => 'dom7sus4'],
  ['maj13', () => 'maj13'],
  ['min13', () => 'min13'],
  ['dom13', () => 'dom13'],
  ['m7b5', () => 'm7b5'],
  ['min11', () => 'min11'],
  ['min9', () => 'min9'],
  ['min7', () => 'min7'],
  ['min6', () => 'min6'],
  ['maj9', () => 'maj9'],
  ['maj7', () => 'maj7'],
  ['maj6', () => 'maj6'],
  ['sus2', () => 'sus2'],
  ['sus4', () => 'sus4'],
  ['sis2', () => 'sus2'],
  ['sis4', () => 'sus4'],
  ['dim7', () => 'dim7'],
  ['add6', (base) => (base === 'min' ? 'min6' : base === 'maj' ? 'maj6' : null)],
  ['dom7', () => 'dom7'],
  ['m13', () => 'min13'],
  ['M13', () => 'maj13'],
  ['m11', () => 'min11'],
  ['m9', () => 'min9'],
  ['m7', () => 'min7'],
  ['m6', () => 'min6'],
  ['M9', () => 'maj9'],
  ['M7', () => 'maj7'],
  ['ø7', () => 'm7b5'],
  ['°7', () => 'dim7'],
  ['Δ9', () => 'maj9'],
  ['Δ7', () => 'maj7'],
  ['7sus', () => 'dom7sus4'],
  ['sus', () => 'sus4'],
  ['sis', () => 'sus4'],
  ['maj', () => 'maj'],
  ['min', () => 'min'],
  ['dim', () => 'dim'],
  ['aug', () => 'aug'],
  ['ø', () => 'm7b5'],
  ['°', () => 'dim'],
  ['Δ', () => 'maj7'],
  ['+', () => 'aug'],
  ['M', () => 'maj'],
  ['m', () => 'min'],
]

const SORTED_WORDS = [...WORDS].sort((a, b) => b[0].length - a[0].length)

export function diatonicTriad(degree: Degree, mode: Mode): Triad {
  const quality = diatonicQuality(degree, mode)
  if (quality === 'min') return 'min'
  if (quality === 'dim') return 'dim'
  return 'maj'
}

export function parseQualityBody(body: string, grammar: GrammarKind, base: Triad): QualityParse | { error: string } {
  if (body === '') return { quality: triadQuality(base), figure: null }

  let matched: QualityId | null = null
  let matchedWord = ''
  let rest = body
  for (const [word, map] of SORTED_WORDS) {
    if (!body.startsWith(word)) continue
    const quality = map(base)
    if (quality == null) {
      return { error: `"${word}" does not fit this chord. Added 6ths belong on major or minor triads.` }
    }
    matched = quality
    matchedWord = word
    rest = body.slice(word.length)
    break
  }

  if (matched && !isPlainTriad(matched) && rest !== '') {
    return {
      error: `Extra "${rest}" after ${matchedWord}. Inversions of extended chords use a slash bass, such as Cmaj7/B.`,
    }
  }
  if (rest === '') {
    if (!matched) return { error: `Can't read "${body}".` }
    return { quality: matched, figure: null }
  }

  const color = matched && isPlainTriad(matched) ? toTriad(matched) : base
  return applyTail(rest, color, grammar)
}

export function bassFromFigure(root: Spelled, quality: QualityId, figure: Figure | null): Spelled {
  if (!figure) return root
  const label = figure === '6' || figure === '65' ? '3rd' : figure === '64' || figure === '43' ? '5th' : '7th'
  const tone = chordTones(root, quality).find((candidate) => candidate.degreeLabel === label)
  if (!tone) {
    throw new Error(`Chord ${root.name} ${quality} has no ${label} for figure ${figure}`)
  }
  return tone
}

function applyTail(rest: string, color: Triad, grammar: GrammarKind): QualityParse | { error: string } {
  if (rest === '7') {
    if (color === 'aug') return { error: 'Augmented sevenths are not in this version.' }
    return { quality: color === 'maj' ? 'dom7' : color === 'min' ? 'min7' : 'dim7', figure: null }
  }
  if (rest === '9') {
    if (color === 'maj') return { quality: 'dom9', figure: null }
    if (color === 'min') return { quality: 'min9', figure: null }
    return { error: '9ths here are major or minor: C9, Cm9, or Cmaj9.' }
  }
  if (rest === '11') {
    if (color === 'maj') return { quality: 'dom11', figure: null }
    if (color === 'min') return { quality: 'min11', figure: null }
    return { error: '11ths here are major or minor: C11 or Cm11.' }
  }
  if (rest === 'add6') {
    if (color === 'maj') return { quality: 'maj6', figure: null }
    if (color === 'min') return { quality: 'min6', figure: null }
    return { error: 'Added 6ths belong on major or minor triads.' }
  }
  if (rest === '6') {
    if (grammar === 'roman') return { quality: triadQuality(color), figure: '6' }
    if (color === 'maj') return { quality: 'maj6', figure: null }
    if (color === 'min') return { quality: 'min6', figure: null }
    return {
      error:
        'Added 6ths belong on major or minor chords (C6, Cm6). On a Roman numeral, 6 means first inversion: write I6.',
    }
  }
  if (rest === '64') {
    if (grammar !== 'roman') {
      return { error: 'Figured bass 64 is for Roman numerals (I64). Chord symbols use a slash bass (C/G).' }
    }
    return { quality: triadQuality(color), figure: '64' }
  }
  if (rest === '65' || rest === '43' || rest === '42') {
    if (grammar !== 'roman') {
      return {
        error: `Figured bass ${rest} is for Roman numerals (V65). Chord symbols name the bass note (G7/B).`,
      }
    }
    if (color === 'aug') return { error: 'Those figures need a major, minor, or diminished seventh chord.' }
    return {
      quality: color === 'maj' ? 'dom7' : color === 'min' ? 'min7' : 'dim7',
      figure: rest,
    }
  }
  if (rest === '13') {
    if (color === 'maj') return { quality: 'dom13', figure: null }
    if (color === 'min') return { quality: 'min13', figure: null }
    return { error: '13ths here are major or minor: C13, Cm13, or Cmaj13. C13 keeps the flat 7th; it is not C6.' }
  }
  return {
    error: `Can't read "${rest}". Try 7, maj7, m7, 6, 9, 11, 13, sus2, sus4, 7sus4, or a slash bass.`,
  }
}

function triadQuality(triad: Triad): QualityId {
  if (triad === 'min') return 'min'
  if (triad === 'dim') return 'dim'
  if (triad === 'aug') return 'aug'
  return 'maj'
}

function isPlainTriad(quality: QualityId): boolean {
  return quality === 'maj' || quality === 'min' || quality === 'dim' || quality === 'aug'
}

function toTriad(quality: QualityId): Triad {
  if (quality === 'min') return 'min'
  if (quality === 'dim') return 'dim'
  if (quality === 'aug') return 'aug'
  return 'maj'
}
