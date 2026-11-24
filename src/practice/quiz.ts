import { joinSymbols, type ResolvedChord } from '../theory/chord.ts'
import { PRESETS, type Preset } from '../theory/catalog.ts'
import type { Mode, TonicName } from '../theory/pitch.ts'
import { parseInKey } from '../theory/parse.ts'

export type Difficulty = 'triad' | 'color'

export type QuizChoice = { id: string; label: string }

export type QuizPublic = {
  questionId: string
  difficulty: Difficulty
  prompt: string
  choices: QuizChoice[]
}

export type QuizSecret = {
  questionId: string
  correctChoiceId: string
  tonicName: TonicName
  mode: Mode
  answerLabel: string
  chords: ResolvedChord[]
}

export type Grade = {
  correct: boolean
  answerLabel: string
  sounding: string
  keyLabel: string
}

const QUIZ_KEYS: TonicName[] = ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb']
const TRIADS = new Set(['maj', 'min', 'dim', 'aug'])

let questionCount = 0

export function makeQuestion(difficulty: Difficulty, rng: () => number): { publicQuestion: QuizPublic; secret: QuizSecret } {
  const pool = PRESETS.filter((preset) => (difficulty === 'color' ? preset.example === 'color' : isPlainPreset(preset)))
  const correct = pool[Math.floor(rng() * pool.length)] ?? pool[0]
  const distractors = shuffle(
    pool.filter((preset) => preset.mode === correct.mode && preset.id !== correct.id),
    rng,
  ).slice(0, 3)
  const choices = shuffle([correct, ...distractors], rng)
  const tonicName = QUIZ_KEYS[Math.floor(rng() * QUIZ_KEYS.length)] ?? 'C'
  const parsed = parseInKey(correct.formula, tonicName, correct.mode)
  if (!parsed.ok) throw new Error(parsed.error)
  const chords = parsed.chords
  questionCount += 1
  const questionId = `q${questionCount}`
  const correctChoiceId = choiceId(correct)
  return {
    publicQuestion: {
      questionId,
      difficulty,
      prompt: 'Which progression did you hear?',
      choices: choices.map((preset) => ({ id: choiceId(preset), label: choiceLabel(preset) })),
    },
    secret: {
      questionId,
      correctChoiceId,
      tonicName,
      mode: correct.mode,
      answerLabel: choiceLabel(correct),
      chords,
    },
  }
}

export function grade(secret: QuizSecret, choiceId: string): Grade {
  const correct = choiceId === secret.correctChoiceId
  return {
    correct,
    answerLabel: secret.answerLabel,
    sounding: joinSymbols(secret.chords),
    keyLabel: `${secret.tonicName} ${secret.mode}`,
  }
}

function isPlainPreset(preset: Preset): boolean {
  const parsed = parseInKey(preset.formula, 'C', preset.mode)
  if (!parsed.ok) return false
  return parsed.chords.every((chord) => TRIADS.has(chord.quality) && chord.bassRole.kind === 'root')
}

function choiceId(preset: Preset): string {
  return preset.id
}

function choiceLabel(preset: Preset): string {
  return preset.nickname ? `${preset.formula} · ${preset.nickname}` : preset.formula
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swap]
    copy[swap] = current
  }
  return copy
}
