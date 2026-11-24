import { describe, expect, test } from 'vitest'
import { voiceProgression } from '../theory/chord.ts'
import { parseInKey } from '../theory/parse.ts'
import { chordSeconds, remapOrigin, secondsPerBeat } from './meter.ts'
import { beatsPerChord, frameAt, planWindow, selectDispatches, soundingAt, type PlanInput } from './plan.ts'
import { TransportGate } from './transport.ts'

function voiced(text = 'C G') {
  const parsed = parseInKey(text, 'C', 'major')
  if (!parsed.ok) throw new Error(parsed.error)
  return voiceProgression(parsed.chords, 'root')
}

function rolesAt(input: Omit<PlanInput, 'fromBeat' | 'toBeat'>, beat: number) {
  const notes = soundingAt(input, beat)
  return {
    bass: notes.filter((note) => note.role === 'bass').map((note) => note.midi),
    rh: notes.filter((note) => note.role === 'rh').map((note) => note.midi),
  }
}

describe('tempo still scales time, and the pattern chooses the bar', () => {
  test('a quarter at 120 lasts half a second, and waltz uses three of them', () => {
    expect(secondsPerBeat(120)).toBeCloseTo(0.5)
    expect(beatsPerChord('waltz')).toBe(3)
    expect(beatsPerChord('bass-chord')).toBe(4)
    expect(chordSeconds(80, 4)).toBeCloseTo(3)
    const remapped = remapOrigin({ now: 2, oldOriginAudio: 0, oldOriginBeat: 0, oldBpm: 120 })
    expect(remapped.originBeat).toBeCloseTo(4)
  })
})

describe('piano accompaniments are distinct and follow note lifetimes', () => {
  const progression = voiced()

  test('plain audition holds every chord tone for the whole chord', () => {
    const input = { voiced: progression, accompaniment: 'audition' as const, loop: false }
    const early = rolesAt(input, 0.2)
    const later = rolesAt(input, 1.8)
    expect(early.bass).toEqual([progression[0].bassMidi])
    expect(early.rh).toEqual(progression[0].rhMidis)
    expect(later.bass).toEqual(early.bass)
    expect(later.rh).toEqual(early.rh)
    const next = rolesAt(input, 4)
    expect(next.bass).toEqual([progression[1].bassMidi])
    expect(next.rh).not.toEqual(early.rh)
  })

  test('block chords restrike and leave a gap that the held chord does not', () => {
    const block = rolesAt({ voiced: progression, accompaniment: 'block', loop: false }, 1.8)
    const held = rolesAt({ voiced: progression, accompaniment: 'audition', loop: false }, 1.8)
    expect(block.bass).toEqual([])
    expect(block.rh).toEqual([])
    expect(held.rh.length).toBeGreaterThan(0)
    const restrike = rolesAt({ voiced: progression, accompaniment: 'block', loop: false }, 2.1)
    expect(restrike.bass).toEqual([progression[0].bassMidi])
    expect(restrike.rh).toEqual(progression[0].rhMidis)
  })

  test('bass and chord alternates hands', () => {
    const input = { voiced: progression, accompaniment: 'bass-chord' as const, loop: false }
    expect(rolesAt(input, 0.1).bass).toEqual([progression[0].bassMidi])
    expect(rolesAt(input, 0.1).rh).toEqual([])
    expect(rolesAt(input, 1.1).bass).toEqual([])
    expect(rolesAt(input, 1.1).rh).toEqual(progression[0].rhMidis)
    expect(rolesAt(input, 2.1).rh).toEqual([])
  })

  test('a broken chord plays one note at a time, and a finished note is no longer active', () => {
    const input = { voiced: progression, accompaniment: 'arpeggio' as const, loop: false }
    const first = soundingAt(input, 0.05)
    const second = soundingAt(input, 0.6)
    expect(first).toHaveLength(1)
    expect(first[0]?.role).toBe('bass')
    expect(second).toHaveLength(1)
    expect(second[0]?.role).toBe('rh')
    expect(second[0]?.midi).not.toBe(first[0]?.midi)
    const planned = planWindow({ ...input, fromBeat: 0, toBeat: 1 })
    const opening = planned.find((note) => note.startBeat === 0)
    expect(opening).toBeTruthy()
    expect(opening!.endBeat).toBeLessThanOrEqual(0.5)
    expect(soundingAt(input, opening!.endBeat + 0.02).some((note) => note.midi === opening!.midi && note.role === 'bass')).toBe(false)
  })

  test('Alberti puts the bass on the beat with a broken right hand, unlike a one-note arpeggio', () => {
    const alberti = rolesAt({ voiced: progression, accompaniment: 'alberti', loop: false }, 0.05)
    const broken = rolesAt({ voiced: progression, accompaniment: 'arpeggio', loop: false }, 0.05)
    expect(alberti.bass).toHaveLength(1)
    expect(alberti.rh).toHaveLength(1)
    expect(broken.rh).toEqual([])
    const offbeat = rolesAt({ voiced: progression, accompaniment: 'alberti', loop: false }, 0.6)
    expect(offbeat.bass).toEqual([])
    expect(offbeat.rh).toHaveLength(1)
  })

  test('waltz is bass, then chord, then chord', () => {
    const input = { voiced: progression, accompaniment: 'waltz' as const, loop: false }
    expect(rolesAt(input, 0.1).bass).toHaveLength(1)
    expect(rolesAt(input, 0.1).rh).toEqual([])
    expect(rolesAt(input, 1.1).bass).toEqual([])
    expect(rolesAt(input, 1.1).rh.length).toBeGreaterThan(1)
    expect(rolesAt(input, 2.1).rh.length).toBeGreaterThan(1)
    expect(rolesAt(input, 3).bass).toEqual([progression[1].bassMidi])
  })

  test('the added piano patterns are not copies of bass-and-chord', () => {
    const plain = { voiced: progression, accompaniment: 'bass-chord' as const, loop: false }
    const stride = rolesAt({ voiced: progression, accompaniment: 'stride', loop: false }, 2.1)
    expect(stride.bass).toEqual([progression[0].bassMidi + 7])
    expect(stride.rh).toEqual([])
    expect(rolesAt(plain, 2.1).bass).toEqual([progression[0].bassMidi])

    const walkEarly = rolesAt({ voiced: progression, accompaniment: 'walking', loop: false }, 0.1)
    const walkLater = rolesAt({ voiced: progression, accompaniment: 'walking', loop: false }, 1.1)
    expect(walkEarly.rh).toEqual([])
    expect(walkEarly.bass).toEqual([progression[0].bassMidi])
    expect(walkLater.bass).not.toEqual(walkEarly.bass)

    const pedal = rolesAt({ voiced: progression, accompaniment: 'pedal', loop: false }, 3.2)
    expect(pedal.bass).toEqual([progression[0].bassMidi])
    expect(rolesAt({ voiced: progression, accompaniment: 'audition', loop: false }, 0.2).rh.length).toBeGreaterThan(0)
    expect(rolesAt({ voiced: progression, accompaniment: 'pedal', loop: false }, 0.2).rh).toEqual([])

    const octaves = rolesAt({ voiced: progression, accompaniment: 'broken-octaves', loop: false }, 0.6)
    expect(octaves.bass).toEqual([progression[0].bassMidi + 12])
    expect(octaves.rh).toEqual([])

    const rock = rolesAt({ voiced: progression, accompaniment: 'rock', loop: false }, 0.1)
    expect(rock.bass).toHaveLength(2)
    expect(rolesAt({ voiced: progression, accompaniment: 'rock', loop: false }, 0.6).rh.length).toBeGreaterThan(1)

    const march = rolesAt({ voiced: progression, accompaniment: 'march', loop: false }, 0.5)
    expect(march.bass).toEqual([])
    expect(rolesAt(plain, 0.5).bass).toEqual([progression[0].bassMidi])

    const hymnLate = rolesAt({ voiced: progression, accompaniment: 'hymn', loop: false }, 3.7)
    const heldLate = rolesAt({ voiced: progression, accompaniment: 'audition', loop: false }, 3.7)
    expect(hymnLate.rh).toEqual([])
    expect(heldLate.rh.length).toBeGreaterThan(0)
  })

  test('the ballad holds the bass while a single right-hand note changes', () => {
    const input = { voiced: progression, accompaniment: 'ballad' as const, loop: false }
    const rolled = rolesAt(input, 0.6)
    expect(rolled.bass).toEqual([progression[0].bassMidi])
    expect(rolled.rh).toHaveLength(1)
    expect(rolled.rh).not.toEqual(progression[0].rhMidis)
    const arpeggio = rolesAt({ voiced: progression, accompaniment: 'arpeggio', loop: false }, 0.6)
    expect(arpeggio.bass).toEqual([])
  })

  test('the highlight clock and the scheduler share one plan', () => {
    const input = { voiced: progression, accompaniment: 'arpeggio' as const, loop: true }
    for (const beat of [0, 0.2, 0.6, 1.2, 3.9, 4]) {
      expect(frameAt(input, beat).active).toEqual(soundingAt(input, beat))
    }
    expect(frameAt(input, 4).chordIndex).toBe(1)
  })

  test('a loop continues and a finished pass stops', () => {
    const looping = planWindow({
      voiced: progression,
      accompaniment: 'audition',
      loop: true,
      fromBeat: 8,
      toBeat: 8.2,
    })
    const once = planWindow({
      voiced: progression,
      accompaniment: 'audition',
      loop: false,
      fromBeat: 8,
      toBeat: 8.2,
    })
    expect(looping.some((note) => note.role === 'bass')).toBe(true)
    expect(once).toEqual([])
    expect(frameAt({ voiced: progression, accompaniment: 'audition', loop: false }, 8).finished).toBe(true)
  })
})

describe('play does not stack', () => {
  test('a second play request before the first commits invalidates the first', () => {
    const gate = new TransportGate()
    const first = gate.requestPlay()
    const second = gate.requestPlay()
    expect(first.type).toBe('start')
    expect(second.type).toBe('start')
    if (first.type !== 'start' || second.type !== 'start') return
    expect(gate.commit(first.token)).toBe(false)
    expect(gate.commit(second.token)).toBe(true)
    expect(gate.requestPlay()).toEqual({ type: 'ignore' })
  })

  test('stop cancels a start that has not committed, and pause resumes at the same beat', () => {
    const gate = new TransportGate()
    const start = gate.requestPlay()
    if (start.type !== 'start') throw new Error('expected start')
    expect(gate.commit(start.token)).toBe(true)
    gate.pause(3.25)
    const resume = gate.requestPlay()
    expect(resume).toMatchObject({ type: 'start', fromBeat: 3.25 })
    if (resume.type !== 'start') return
    expect(gate.commit(resume.token)).toBe(true)
    gate.interrupt(4)
    expect(gate.status).toBe('paused')
    expect(gate.interrupted).toBe(true)
    gate.stop()
    expect(gate.commit(resume.token)).toBe(false)
    expect(gate.status).toBe('stopped')
  })

  test('already dispatched notes are not dispatched again', () => {
    const notes = planWindow({
      voiced: voiced('C'),
      accompaniment: 'audition',
      loop: false,
      fromBeat: 0,
      toBeat: 1,
    })
    const first = selectDispatches(notes, 0, 1, new Set())
    expect(first.length).toBeGreaterThan(0)
    expect(selectDispatches(notes, 0, 1, new Set(first.map((note) => note.id)))).toEqual([])
    const ended = notes[0]
    expect(ended).toBeTruthy()
    expect(selectDispatches([ended!], ended!.endBeat + 0.01, 1, new Set())).toEqual([])
  })
})
