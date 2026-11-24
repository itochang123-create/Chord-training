import { describe, expect, test } from 'vitest'
import { voiceProgression } from '../theory/chord.ts'
import { makeKey } from '../theory/pitch.ts'
import { parseInKey } from '../theory/parse.ts'
import { grade, makeQuestion } from './quiz.ts'
import { stageModel } from './stageModel.ts'
import { loadSettings, saveSettings, type KeyValueStore } from './storage.ts'

function rngFrom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

describe('listen mode does not reveal the chord', () => {
  test('a hidden stage has no symbol, roman numeral, pitches, or piano notes', () => {
    const parsed = parseInKey('D/F#', 'G', 'major')
    if (!parsed.ok) throw new Error(parsed.error)
    const voiced = voiceProgression(parsed.chords, 'root')[0]
    const hidden = stageModel({
      workspace: 'listen',
      revealed: false,
      chordIndex: 0,
      chordCount: 1,
      voiced,
    })
    expect(hidden.kind).toBe('hidden')
    expect('chord' in hidden).toBe(false)
    const text = JSON.stringify(hidden)
    expect(text).not.toContain('D/F')
    expect(text).not.toContain('V6')
    expect(text).not.toContain('piano')
    expect(hidden.positionLabel).toBe('Chord 1')
  })

  test('reveal returns the bass, the right hand, and the sounding pitches', () => {
    const parsed = parseInKey('D/F#', 'G', 'major')
    if (!parsed.ok) throw new Error(parsed.error)
    const voiced = voiceProgression(parsed.chords, 'root')[0]
    const shown = stageModel({ workspace: 'listen', revealed: true, chordIndex: 0, chordCount: 1, voiced })
    expect(shown.kind).toBe('shown')
    if (shown.kind !== 'shown') return
    expect(shown.chord.symbol).toBe('D/F♯')
    expect(shown.chord.bassDescription).toMatch(/First inversion/)
    expect(shown.chord.bassDescription).toMatch(/Bass|bass/)
    expect(shown.chord.rhLabel).toMatch(/Root position/)
    expect(shown.chord.piano.some((note) => note.role === 'bass')).toBe(true)
    expect(shown.chord.piano.some((note) => note.role === 'rh')).toBe(true)
  })
})

describe('quiz', () => {
  test('the public question does not mark the answer, and playback matches the correct choice', () => {
    const made = makeQuestion('triad', rngFrom(7))
    expect(Object.keys(made.publicQuestion).sort()).toEqual(['choices', 'difficulty', 'prompt', 'questionId'])
    expect(JSON.stringify(made.publicQuestion)).not.toContain('correctChoiceId')
    expect(made.publicQuestion.choices).toHaveLength(4)
    const correct = made.publicQuestion.choices.find((choice) => choice.id === made.secret.correctChoiceId)
    expect(correct).toBeTruthy()
    const formula = correct!.label.split(' · ')[0]
    const parsed = parseInKey(formula, made.secret.tonicName, made.secret.mode)
    if (!parsed.ok) throw new Error(parsed.error)
    expect(made.secret.chords.map((chord) => chord.symbol)).toEqual(parsed.chords.map((chord) => chord.symbol))
    const wrong = made.publicQuestion.choices.find((choice) => choice.id !== made.secret.correctChoiceId)!
    const graded = grade(made.secret, wrong.id)
    expect(graded.correct).toBe(false)
    expect(grade(made.secret, made.secret.correctChoiceId).correct).toBe(true)
    expect(graded.sounding).not.toBe(wrong.label)
  })

  test('color questions play the written chords and do not recolor the whole loop', () => {
    const made = makeQuestion('color', rngFrom(11))
    const correct = made.publicQuestion.choices.find((choice) => choice.id === made.secret.correctChoiceId)!
    const formula = correct.label.split(' · ')[0]
    const parsed = parseInKey(formula, made.secret.tonicName, made.secret.mode)
    if (!parsed.ok) throw new Error(parsed.error)
    expect(made.secret.chords.map((chord) => chord.quality)).toEqual(parsed.chords.map((chord) => chord.quality))
    expect(made.secret.chords.map((chord) => chord.symbol)).toEqual(parsed.chords.map((chord) => chord.symbol))
    expect(new Set(parsed.chords.map((chord) => chord.quality)).size).toBeGreaterThan(1)
    expect(made.publicQuestion.difficulty).toBe('color')
  })

  test('the same seed asks the same question', () => {
    const first = makeQuestion('triad', rngFrom(3))
    const second = makeQuestion('triad', rngFrom(3))
    expect(first.secret.tonicName).toBe(second.secret.tonicName)
    expect(first.publicQuestion.choices.map((choice) => choice.id)).toEqual(second.publicQuestion.choices.map((choice) => choice.id))
    expect(makeKey(first.secret.tonicName, first.secret.mode).tonic.name).toBe(first.secret.tonicName)
  })
})

describe('settings stay on the device', () => {
  test('round-trips through a local store and ignores broken data', () => {
    const memory = new Map<string, string>()
    const store: KeyValueStore = {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => memory.set(key, value),
    }
    expect(loadSettings(store).presetId).toBe('6415')
    saveSettings({ ...loadSettings(store), tempo: 92, presetId: '1645', tonicName: 'Eb' }, store)
    expect(loadSettings(store)).toMatchObject({ tempo: 92, presetId: '1645', tonicName: 'Eb' })
    store.setItem('chord.ito.v1', '{')
    expect(loadSettings(store).tonicName).toBe('C')
  })
})
