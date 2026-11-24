import { realize, type QualityId, type ResolvedChord } from './chord.ts'
import { locateDegree, spellInterval, type Degree, type Key } from './pitch.ts'

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
  '7 and 9 color V, and also ii or vi when that chord is already minor. I and IV stay triads. 11 colors V, and ii when the loop has one. 13 colors V and keeps a flat 7th, so it is not a 6th chord. Sus is one dominant that resolves, such as Gsus4 then G. Dim adds one passing dim7 where the roots move by a step, or one leading-tone dim7 into the tonic.'

type Level = '13' | '11' | '9' | '7'

const MINORISH = new Set<QualityId>(['min', 'min6', 'min7', 'min9', 'min11', 'min13', 'm7b5'])

export function applyColors(chords: ResolvedChord[], key: Key, flags: ColorFlags): ResolvedChord[] {
  if (!chords.length || !COLOR_BUTTONS.some((button) => flags[button.id])) return chords
  const withDim = flags.dim ? insertOneDim(chords, key) : chords
  const extended = extendIdiomatic(withDim, key, flags)
  return flags.sus ? resolveOneSus(extended, key, flags) : extended
}

function extendIdiomatic(chords: ResolvedChord[], key: Key, flags: ColorFlags): ResolvedChord[] {
  const levels = selectedLevels(flags)
  if (!levels.length) return chords
  let changed = false
  const next = chords.map((chord) => {
    if (locked(chord)) return chord
    const quality = idiomaticQuality(chord, key, levels)
    if (!quality) return chord
    changed = true
    return realize(chord.root, quality, chord.bass, key)
  })
  if (changed) return next
  const index = fallbackIndex(chords, key)
  const quality = dominantQuality(chords[index], levels[0])
  if (!quality) return next
  next[index] = realize(chords[index].root, quality, chords[index].bass, key)
  return next
}

function idiomaticQuality(chord: ResolvedChord, key: Key, levels: Level[]): QualityId | null {
  const degree = degreeOf(chord, key)
  const minor = MINORISH.has(chord.quality)
  for (const level of levels) {
    if (level === '13' && degree === 5 && !minor) return 'dom13'
    if (level === '11' && ((degree === 5 && !minor) || (degree === 2 && minor))) return degree === 2 ? 'min11' : 'dom11'
    if (level === '9' && ((degree === 5 && !minor) || (minor && (degree === 2 || degree === 6)))) {
      return degree === 5 ? 'dom9' : 'min9'
    }
    if (level === '7' && ((degree === 5) || (minor && (degree === 2 || degree === 6)))) {
      if (degree === 5 && minor) return 'min7'
      if (degree === 5) return 'dom7'
      return 'min7'
    }
  }
  return null
}

function dominantQuality(chord: ResolvedChord, level: Level): QualityId | null {
  const minor = MINORISH.has(chord.quality)
  if (level === '13') return minor ? 'min13' : 'dom13'
  if (level === '11') return minor ? 'min11' : 'dom11'
  if (level === '9') return minor ? 'min9' : 'dom9'
  return minor ? 'min7' : 'dom7'
}

function resolveOneSus(chords: ResolvedChord[], key: Key, flags: ColorFlags): ResolvedChord[] {
  const target = susIndex(chords, key)
  if (target < 0) return chords
  const current = chords[target]
  if (locked(current)) return chords
  const seventh = flags.seven || flags.nine || flags.eleven || flags.thirteen
  const sus = realize(current.root, seventh ? 'dom7sus4' : 'sus4', current.bass, key)
  const out = chords.slice()
  out[target] = sus
  const next = chords[target + 1]
  if (next && next.root.pc === current.root.pc && next.quality !== 'sus4' && next.quality !== 'dom7sus4') return out
  out.splice(target + 1, 0, current)
  return out
}

function insertOneDim(chords: ResolvedChord[], key: Key): ResolvedChord[] {
  if (chords.length < 2 || chords.some((chord) => chord.quality === 'dim' || chord.quality === 'dim7')) return chords
  for (let index = 0; index < chords.length; index += 1) {
    const current = chords[index]
    const next = chords[(index + 1) % chords.length]
    const rising = (next.root.pc - current.root.pc + 12) % 12
    if (rising !== 1 && rising !== 2) continue
    const passing = spellInterval(current.root, 1, 0)
    if (passing.pc === next.root.pc || passing.pc === current.root.pc) continue
    return insertAfter(chords, index, realize(passing, 'dim7', passing, key))
  }
  for (let index = 0; index < chords.length; index += 1) {
    const next = chords[(index + 1) % chords.length]
    if (degreeOf(next, key) !== 1) continue
    const lead = spellInterval(next.root, 11, 6)
    if (lead.pc === chords[index].root.pc || lead.pc === next.root.pc) continue
    return insertAfter(chords, index, realize(lead, 'dim7', lead, key))
  }
  return chords
}

function insertAfter(chords: ResolvedChord[], index: number, chord: ResolvedChord): ResolvedChord[] {
  const out = chords.slice()
  out.splice(index + 1, 0, chord)
  return out
}

function susIndex(chords: ResolvedChord[], key: Key): number {
  for (const degree of [5, 4, 2] as Degree[]) {
    const index = chords.findIndex((chord) => degreeOf(chord, key) === degree && !locked(chord))
    if (index >= 0) return index
  }
  return chords.findIndex((chord) => !locked(chord))
}

function fallbackIndex(chords: ResolvedChord[], key: Key): number {
  for (let index = chords.length - 1; index >= 0; index -= 1) {
    if (!locked(chords[index]) && degreeOf(chords[index], key) !== 1) return index
  }
  return Math.max(0, chords.findIndex((chord) => !locked(chord)))
}

function selectedLevels(flags: ColorFlags): Level[] {
  const levels: Level[] = []
  if (flags.thirteen) levels.push('13')
  if (flags.eleven) levels.push('11')
  if (flags.nine) levels.push('9')
  if (flags.seven) levels.push('7')
  return levels
}

function locked(chord: ResolvedChord): boolean {
  return chord.quality === 'dim' || chord.quality === 'dim7' || chord.quality === 'aug'
}

function degreeOf(chord: ResolvedChord, key: Key): Degree | null {
  try {
    return locateDegree(chord.root, key).degree
  } catch {
    return null
  }
}
