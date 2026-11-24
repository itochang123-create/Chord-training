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
  'Each button adds that color once, not on every chord. 7 sits on V, 9 on ii, 11 on IV, and 13 on V. Sus sits on the dominant so the next chord can resolve it. Dim inserts one passing dim7 after the first chord. Buttons combine when the loop has room; a richer chord keeps the 7th it already contains.'

type Job = 'sus' | '13' | '11' | '9' | '7'

const MINORISH = new Set<QualityId>(['min', 'min6', 'min7', 'min9', 'min11', 'min13', 'm7b5'])

export function applyColors(chords: ResolvedChord[], key: Key, flags: ColorFlags): ResolvedChord[] {
  if (!chords.length || !anyColor(flags)) return chords
  const next = chords.map((chord) => chord)
  const locked = new Set<number>()
  if (flags.dim && !next.some((chord) => chord.quality === 'dim' || chord.quality === 'dim7')) {
    const passing = passingDim(next[0], key)
    next.splice(1, 0, passing)
    locked.add(1)
  }

  const jobs = new Map<number, Set<Job>>()
  const avoid = new Set(locked)
  const claim = (prefer: Degree[], job: Job) => {
    const home = pick(next, key, prefer, avoid, true)
    if (home == null) return
    addJob(jobs, home, job)
    avoid.add(home)
  }

  if (flags.sus) claim([5, 7], 'sus')
  if (flags.thirteen) claim([5, 7, 2], '13')
  if (flags.eleven) claim([4, 2, 6], '11')
  if (flags.nine && !impliesNine(jobs)) claim([2, 5, 4], '9')
  if (flags.seven) {
    const preferred = pick(next, key, [5, 7], avoid, false)
    if (preferred != null) {
      addJob(jobs, preferred, '7')
      avoid.add(preferred)
    } else if (!impliesSeventh(jobs)) {
      const sus = [...jobs.entries()].find(([, set]) => set.has('sus'))
      if (sus) addJob(jobs, sus[0], '7')
      else claim([5, 7, 1], '7')
    }
  }

  for (const [index, set] of jobs) {
    const chord = next[index]
    if (!chord || locked.has(index)) continue
    next[index] = realize(chord.root, qualityFor(chord, key, set), chord.bass, key)
  }
  return next
}

function anyColor(flags: ColorFlags): boolean {
  return COLOR_BUTTONS.some((button) => flags[button.id])
}

function passingDim(after: ResolvedChord, key: Key): ResolvedChord {
  const root = spellInterval(after.root, 1, 0)
  return realize(root, 'dim7', root, key)
}

function addJob(jobs: Map<number, Set<Job>>, index: number, job: Job) {
  const set = jobs.get(index) ?? new Set<Job>()
  set.add(job)
  jobs.set(index, set)
}

function impliesNine(jobs: Map<number, Set<Job>>): boolean {
  return [...jobs.values()].some((set) => set.has('13') || set.has('11') || set.has('9'))
}

function impliesSeventh(jobs: Map<number, Set<Job>>): boolean {
  return [...jobs.values()].some((set) => set.has('13') || set.has('11') || set.has('9') || set.has('7'))
}

function pick(
  chords: ResolvedChord[],
  key: Key,
  prefer: Degree[],
  avoid: Set<number>,
  allowFallback: boolean,
): number | null {
  const degrees = chords.map((chord) => degreeOf(chord, key))
  for (const wanted of prefer) {
    const index = degrees.findIndex((degree, chordIndex) => degree === wanted && !avoid.has(chordIndex))
    if (index >= 0) return index
  }
  if (!allowFallback) return null
  const fallback = degrees.findIndex((_, chordIndex) => !avoid.has(chordIndex))
  return fallback >= 0 ? fallback : null
}

function degreeOf(chord: ResolvedChord, key: Key): Degree | null {
  try {
    return locateDegree(chord.root, key).degree
  } catch {
    return null
  }
}

function qualityFor(chord: ResolvedChord, key: Key, jobs: Set<Job>): QualityId {
  const degree = degreeOf(chord, key)
  const minor = MINORISH.has(chord.quality) || chord.quality === 'dim' || chord.quality === 'dim7'
  if (jobs.has('sus')) return jobs.has('7') || jobs.has('9') || jobs.has('13') || jobs.has('11') ? 'dom7sus4' : 'sus4'
  if (jobs.has('13')) return minor ? 'min13' : degree === 1 ? 'maj13' : 'dom13'
  if (jobs.has('11')) return minor ? 'min11' : 'dom11'
  if (jobs.has('9')) {
    if (minor) return 'min9'
    return degree === 1 ? 'maj9' : 'dom9'
  }
  if (chord.quality === 'dim' || chord.quality === 'dim7') return 'dim7'
  if (minor) return 'min7'
  if (degree === 1) return 'maj7'
  return 'dom7'
}