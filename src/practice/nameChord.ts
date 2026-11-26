import { performanceSignature, type PerformanceConfig } from '../audio/engine.ts'
import { realize, soundingPcs, voiceProgression, type QualityId, type VoicedChord } from '../theory/chord.ts'
import { makeKey, prettify, spell, type TonicName } from '../theory/pitch.ts'
import { PRACTICE_VOLUME } from './storage.ts'

export const NAME_ANSWERS = [
  { id: 'major', label: 'Major' },
  { id: 'minor', label: 'Minor' },
  { id: '7', label: '7' },
  { id: '9', label: '9' },
  { id: '11', label: '11' },
  { id: '13', label: '13' },
  { id: 'sus', label: 'sus' },
  { id: 'dim', label: 'dim' },
] as const

export type NameAnswer = (typeof NAME_ANSWERS)[number]['id']

const QUALITY: Record<NameAnswer, QualityId> = {
  major: 'maj',
  minor: 'min',
  '7': 'dom7',
  '9': 'dom9',
  '11': 'dom11',
  '13': 'dom13',
  sus: 'sus4',
  dim: 'dim',
}

/** One spelling per pitch class, in a comfortable piano range. */
export const NAME_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const satisfies readonly TonicName[]

export type NameTrial = {
  id: string
  answer: NameAnswer
  /** Hidden until the player guesses. */
  label: string
  voiced: VoicedChord
}

export function makeNameTrial(rng: () => number): NameTrial {
  const answer = NAME_ANSWERS[Math.floor(rng() * NAME_ANSWERS.length)]?.id ?? 'major'
  const root = NAME_ROOTS[Math.floor(rng() * NAME_ROOTS.length)] ?? 'C'
  const spelled = spellFrom(root)
  const chord = realize(spelled, QUALITY[answer], spelled, makeKey('C', 'major'))
  const voiced = foldHigh(voiceProgression([chord], 'root')[0])
  return {
    id: `${root}-${answer}`,
    answer,
    label: chordLabel(root, answer),
    voiced,
  }
}

function foldHigh(voiced: VoicedChord): VoicedChord {
  const rhMidis = [...voiced.rhMidis]
  const sounding = voiced.sounding.map((note) => ({ ...note }))
  let guard = 0
  while (Math.max(...rhMidis) > 81 && guard < 6) {
    const top = Math.max(...rhMidis)
    if (top - 12 < 60) break
    rhMidis[rhMidis.indexOf(top)] = top - 12
    const heard = sounding.find((note) => note.role === 'rh' && note.midi === top)
    if (heard) {
      heard.midi = top - 12
      heard.name = heard.name.replace(/\d+$/, String(Math.floor((top - 12) / 12) - 1))
    }
    guard += 1
  }
  rhMidis.sort((left, right) => left - right)
  return { ...voiced, rhMidis, sounding }
}

export function chordLabel(root: TonicName, answer: NameAnswer): string {
  const name = prettify(root)
  if (answer === 'major') return name
  if (answer === 'minor') return `${name}m`
  if (answer === 'sus') return `${name}sus`
  if (answer === 'dim') return `${name}dim`
  return `${name}${answer}`
}

export function namePerformance(trial: NameTrial, arpeggio: boolean): PerformanceConfig {
  const partial = {
    bpm: arpeggio ? 72 : 140,
    accompaniment: arpeggio ? ('arpeggio' as const) : ('audition' as const),
    loop: false,
    volume: PRACTICE_VOLUME,
    voiced: [trial.voiced],
  }
  return { ...partial, signature: performanceSignature(partial) }
}

export function trialPcs(trial: NameTrial): number[] {
  return soundingPcs(trial.voiced)
}

function spellFrom(root: TonicName) {
  const accidental = root.endsWith('b') ? -1 : root.endsWith('#') ? 1 : 0
  const letter = root[0] as 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
  return spell(letter, accidental as -1 | 0 | 1)
}
