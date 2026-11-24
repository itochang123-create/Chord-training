import { realize, type QualityId, type ResolvedChord } from './chord.ts'
import { locateDegree, spellInterval, type Degree, type Key, type Spelled } from './pitch.ts'

export type ColorId = 'seven' | 'nine' | 'eleven' | 'thirteen' | 'sus' | 'dim'

export type ColorFlags = Record<ColorId, boolean>

export const COLOR_BUTTONS: Array<{ id: ColorId; label: string }> = [
  { id: 'seven', label: '7' },
  { id: 'nine', label: '9' },
  { id: 'eleven', label: '11' },
  { id: 'thirteen', label: '13' },
  { id: 'sus', label: 'sus' },
  { id: 'dim', label: 'dim' },
]

export const EMPTY_COLORS: ColorFlags = {
  seven: false,
  nine: false,
  eleven: false,
  thirteen: false,
  sus: false,
  dim: false,
}

export const COLOR_RULE =
  '7, 9, 11, and 13 color most of the loop. I and IV take major 7ths or 9ths, ii and vi take minor 7ths or 9ths, and V takes a dominant 7, 9, or 13. 11 skips the major tonic and leaves out the 3rd. 13 keeps a 7th, so it is not a 6th chord. Sus lands on ii, IV, and V so it can resolve. Dim adds a passing or leading-tone dim7 wherever the roots move by a step, and again into the tonic. The richest button wins on each chord.'

type Level = '13' | '11' | '9' | '7'

const MINORISH = new Set<QualityId>(['min', 'min6', 'min7', 'min9', 'min11', 'min13', 'm7b5'])

export function applyColors(chords: ResolvedChord[], key: Key, flags: ColorFlags): ResolvedChord[] {
  if (!chords.length || !COLOR_BUTTONS.some((button) => flags[button.id])) return chords
  const withDims = flags.dim ? insertDims(chords, key) : chords
  return withDims.map((chord) => recolor(chord, key, flags))
}

function recolor(chord: ResolvedChord, key: Key, flags: ColorFlags): ResolvedChord {
  if (chord.quality === 'dim' || chord.quality === 'dim7' || chord.quality === 'aug') return chord
  const degree = degreeOf(chord, key)
  if (flags.sus && degree != null && (degree === 2 || degree === 4 || degree === 5)) {
    const seventh = flags.seven || flags.nine || flags.eleven || flags.thirteen
    return realize(chord.root, seventh ? 'dom7sus4' : 'sus4', chord.bass, key)
  }
  for (const level of selectedLevels(flags)) {
    const quality = extensionQuality(chord, degree, level)
    if (quality) return realize(chord.root, quality, chord.bass, key)
  }
  return chord
}

function selectedLevels(flags: ColorFlags): Level[] {
  const levels: Level[] = []
  if (flags.thirteen) levels.push('13')
  if (flags.eleven) levels.push('11')
  if (flags.nine) levels.push('9')
  if (flags.seven) levels.push('7')
  return levels
}

function extensionQuality(chord: ResolvedChord, degree: Degree | null, level: Level): QualityId | null {
  const minor = MINORISH.has(chord.quality)
  if (level === '11' && !minor && degree === 1) return null
  if (level === '13') {
    if (minor) return 'min13'
    if (degree === 5 || degree === 7) return 'dom13'
    if (degree === 1 || degree === 4) return 'maj13'
    return 'dom13'
  }
  if (level === '11') return minor ? 'min11' : 'dom11'
  if (level === '9') {
    if (minor) return 'min9'
    if (degree === 1 || degree === 4) return 'maj9'
    return 'dom9'
  }
  if (chord.quality === 'dim') return 'm7b5'
  if (minor) return 'min7'
  if (degree === 1 || degree === 4) return 'maj7'
  return 'dom7'
}

function insertDims(chords: ResolvedChord[], key: Key): ResolvedChord[] {
  if (chords.length < 2) return chords
  const out: ResolvedChord[] = []
  const seen = new Set(
    chords.filter((chord) => chord.quality === 'dim' || chord.quality === 'dim7').map((chord) => chord.root.pc),
  )
  for (let index = 0; index < chords.length; index += 1) {
    const current = chords[index]
    const next = chords[(index + 1) % chords.length]
    out.push(current)
    const rising = (next.root.pc - current.root.pc + 12) % 12
    const candidates: Spelled[] = []
    if (rising === 1 || rising === 2) {
      const passing = spellInterval(current.root, 1, 0)
      if (passing.pc !== next.root.pc && passing.pc !== current.root.pc) candidates.push(passing)
    }
    if (degreeOf(next, key) === 1) {
      const lead = spellInterval(next.root, 11, 6)
      if (lead.pc !== current.root.pc && lead.pc !== next.root.pc) candidates.push(lead)
    }
    for (const root of candidates) {
      if (seen.has(root.pc)) continue
      seen.add(root.pc)
      out.push(realize(root, 'dim7', root, key))
    }
  }
  return out
}

function degreeOf(chord: ResolvedChord, key: Key): Degree | null {
  try {
    return locateDegree(chord.root, key).degree
  } catch {
    return null
  }
}
