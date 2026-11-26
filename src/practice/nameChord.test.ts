import { describe, expect, test } from 'vitest'
import { NAME_ANSWERS, chordLabel, makeNameTrial, namePerformance, trialPcs, type NameAnswer } from './nameChord.ts'

function rngFrom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

describe('name the chord', () => {
  test('the eight answers are the only choices, and dim is a triad', () => {
    expect(NAME_ANSWERS.map((answer) => answer.label)).toEqual(['Major', 'Minor', '7', '9', '11', '13', 'sus', 'dim'])
    const dims = Array.from({ length: 40 }, () => makeNameTrial(() => 7 / 8))
    expect(dims.every((trial) => trial.answer === 'dim' && trial.voiced.chord.quality === 'dim')).toBe(true)
  })

  test('labels match the examples and hide nothing inside the quality word', () => {
    expect(chordLabel('G', '9')).toBe('G9')
    expect(chordLabel('Eb', 'sus')).toBe('E♭sus')
    expect(chordLabel('F#', 'dim')).toBe('F♯dim')
    expect(chordLabel('Bb', 'minor')).toBe('B♭m')
    expect(chordLabel('C', 'major')).toBe('C')
  })

  test('a seeded trial is stable, and roots are not stuck on C', () => {
    const first = makeNameTrial(rngFrom(4))
    const second = makeNameTrial(rngFrom(4))
    expect(first.label).toBe(second.label)
    expect(first.answer).toBe(second.answer)
    const roots = new Set(Array.from({ length: 24 }, () => makeNameTrial(rngFrom(Math.floor(Math.random() * 1000) + 1)).voiced.chord.root.name))
    expect(roots.size).toBeGreaterThan(1)
  })

  test('each quality is reachable and uses the same omissions as the color voicing', () => {
    const seen = new Set<NameAnswer>()
    for (let index = 0; index < NAME_ANSWERS.length; index += 1) {
      seen.add(makeNameTrial(() => index / NAME_ANSWERS.length + 0.01).answer)
    }
    expect([...seen].sort()).toEqual(['11', '13', '7', '9', 'dim', 'major', 'minor', 'sus'])

    const nine = forced('9')
    expect(trialPcs(nine)).toEqual(expect.arrayContaining([nine.voiced.chord.root.pc]))
    expect(nine.voiced.sounding.some((note) => note.degreeLabel === '5th')).toBe(false)
    expect(nine.voiced.sounding.some((note) => note.degreeLabel === '7th')).toBe(true)

    const eleventh = forced('11')
    expect(eleventh.voiced.sounding.some((note) => note.degreeLabel === '3rd' || note.degreeLabel === '5th')).toBe(false)
    expect(eleventh.voiced.sounding.some((note) => note.degreeLabel === '7th')).toBe(true)

    const thirteenth = forced('13')
    expect(thirteenth.voiced.sounding.some((note) => note.degreeLabel === '7th')).toBe(true)
    expect(thirteenth.voiced.chord.quality).toBe('dom13')

    for (const trial of [nine, eleventh, thirteenth, forced('major'), forced('sus'), forced('dim')]) {
      expect(trial.voiced.bassMidi).toBeGreaterThanOrEqual(40)
      expect(trial.voiced.bassMidi).toBeLessThanOrEqual(59)
      expect(trial.voiced.rhMidis.every((midi) => midi >= 60 && midi <= 86)).toBe(true)
    }
  })

  test('the held chord is one block, and arpeggio is a separate listen', () => {
    const trial = makeNameTrial(rngFrom(2))
    const block = namePerformance(trial, false)
    const rolled = namePerformance(trial, true)
    expect(block.accompaniment).toBe('audition')
    expect(block.loop).toBe(false)
    expect(block.voiced).toHaveLength(1)
    expect(rolled.accompaniment).toBe('arpeggio')
    expect(rolled.bpm).toBeLessThan(block.bpm)
  })
})

function forced(answer: NameAnswer) {
  const index = NAME_ANSWERS.findIndex((item) => item.id === answer)
  return makeNameTrial(() => (index + 0.1) / NAME_ANSWERS.length)
}
