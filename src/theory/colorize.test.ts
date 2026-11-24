import { describe, expect, test } from 'vitest'
import setupSource from '../components/Setup.tsx?raw'
import { ACCOMPANIMENT_IDS, ACCOMPANIMENTS } from '../audio/plan.ts'
import { PRESETS } from './catalog.ts'
import { applyColors, COLOR_RULE, EMPTY_COLORS, type ColorFlags } from './colorize.ts'
import type { ResolvedChord } from './chord.ts'
import { makeKey } from './pitch.ts'
import { parseInKey } from './parse.ts'

const key = makeKey('C', 'major')

function colored(formula: string, flags: Partial<ColorFlags> = {}): ResolvedChord[] {
  const parsed = parseInKey(formula, 'C', 'major')
  if (!parsed.ok) throw new Error(parsed.error)
  return applyColors(parsed.chords, key, { ...EMPTY_COLORS, ...flags })
}

function symbols(formula: string, flags: Partial<ColorFlags> = {}) {
  return colored(formula, flags).map((chord) => chord.symbol)
}

describe('color buttons teach the color across the loop', () => {
  test('the on-screen rule describes a dense loop, not a single chord', () => {
    expect(COLOR_RULE).toMatch(/most of the loop/)
    expect(COLOR_RULE).not.toMatch(/once, not on every chord/)
    expect(COLOR_RULE).toMatch(/passing or leading-tone/)
    expect(COLOR_RULE).toMatch(/not a 6th/)
  })

  test('1645 with 7 is major sevenths on I and IV, minor 7 on vi, and dominant 7 on V', () => {
    expect(symbols('I–vi–IV–V', { seven: true })).toEqual(['Cmaj7', 'Am7', 'Fmaj7', 'G7'])
  })

  test('1645 with 9 uses major 9ths, a minor 9th, and a dominant 9th', () => {
    expect(symbols('I–vi–IV–V', { nine: true })).toEqual(['Cmaj9', 'Am9', 'Fmaj9', 'G9'])
  })

  test('1645 with 11 skips the major tonic and uses 11ths that are not triads', () => {
    const chords = colored('I–vi–IV–V', { eleven: true })
    expect(chords.map((chord) => chord.symbol)).toEqual(['C', 'Am11', 'F11', 'G11'])
    expect(chords[1]?.quality).toBe('min11')
    expect(chords[2]?.quality).toBe('dom11')
    expect(chords[3]?.quality).toBe('dom11')
  })

  test('1645 with 13 keeps a 7th on V and is not a 6th chord', () => {
    const chords = colored('I–vi–IV–V', { thirteen: true })
    expect(chords.map((chord) => chord.symbol)).toEqual(['Cmaj13', 'Am13', 'Fmaj13', 'G13'])
    expect(chords[3]?.quality).toBe('dom13')
    expect(chords[3]?.tones.some((tone) => tone.degreeLabel === '7th')).toBe(true)
    expect(chords[3]?.symbol.endsWith('6')).toBe(false)
  })

  test('9 already includes the 7th, so 7 plus 9 is the 9th loop', () => {
    expect(symbols('I–vi–IV–V', { seven: true, nine: true })).toEqual(['Cmaj9', 'Am9', 'Fmaj9', 'G9'])
    expect(symbols('ii–V–I', { nine: true, seven: true })).toEqual(['Dm9', 'G9', 'Cmaj9'])
  })

  test('sus colors ii, IV, and V, and a 7th makes those sus chords 7sus4', () => {
    expect(symbols('I–vi–IV–V', { sus: true })).toEqual(['C', 'Am', 'Fsus4', 'Gsus4'])
    expect(symbols('I–vi–IV–V', { sus: true, seven: true })).toEqual(['Cmaj7', 'Am7', 'F7sus4', 'G7sus4'])
    expect(symbols('ii–V–I', { sus: true })).toEqual(['Dsus4', 'Gsus4', 'C'])
  })

  test('dim adds passing and leading-tone dim7s without replacing the loop', () => {
    expect(symbols('I–vi–IV–V', { dim: true })).toEqual(['C', 'Am', 'F', 'F#dim7', 'G', 'Bdim7'])
    const already = symbols(PRESETS.find((preset) => preset.id === 'color-passing-dim')!.formula, { dim: true })
    expect(already.some((symbol) => symbol.includes('dim7'))).toBe(true)
    expect(already.filter((symbol) => symbol.includes('dim7')).length).toBeLessThan(already.length)
  })

  test('7 plus dim keeps the sevenths and the passing colors', () => {
    expect(symbols('I–vi–IV–V', { seven: true, dim: true })).toEqual([
      'Cmaj7',
      'Am7',
      'Fmaj7',
      'F#dim7',
      'G7',
      'Bdim7',
    ])
  })

  test('a custom line is colored the same way', () => {
    expect(symbols('Dm G C', { seven: true })).toEqual(['Dm7', 'G7', 'Cmaj7'])
  })

  test('an untouched loop stays a triad loop', () => {
    expect(symbols('I–vi–IV–V')).toEqual(['C', 'Am', 'F', 'G'])
  })
})

describe('practice controls that left the desk', () => {
  test('the setup has no key, volume, voice-leading, or per-chord editor', () => {
    const setup = setupSource
    expect(setup).not.toContain('data-testid="tonic"')
    expect(setup).not.toContain('data-testid="volume"')
    expect(setup).not.toContain('data-testid="voicing"')
    expect(setup).not.toContain('data-testid="chord-root"')
    expect(setup).not.toContain('Hear it in')
    expect(setup).toContain('data-testid="accompaniment"')
    expect(setup).toContain('data-testid="custom-progression"')
    expect(setup).toContain('Save on this device')
    expect(setup.indexOf('data-testid="accompaniment"')).toBeLessThan(setup.indexOf('data-testid="custom-progression"'))
    expect(setup.indexOf('data-testid="progression"')).toBeLessThan(setup.indexOf('data-testid="accompaniment"'))
  })

  test('the accompaniment menu keeps the original patterns and adds the larger set', () => {
    for (const id of ['audition', 'block', 'bass-chord', 'arpeggio', 'alberti', 'waltz', 'ballad'] as const) {
      expect(ACCOMPANIMENT_IDS).toContain(id)
    }
    for (const id of ['stride', 'walking', 'pedal', 'broken-octaves', 'rolled', 'pop-eighths', 'rock', 'hymn', 'jazz', 'gospel', 'bossa', 'march', 'tremolo', 'tresillo'] as const) {
      expect(ACCOMPANIMENT_IDS).toContain(id)
    }
    expect(new Set(ACCOMPANIMENT_IDS).size).toBe(ACCOMPANIMENT_IDS.length)
    for (const id of ACCOMPANIMENT_IDS) {
      expect(ACCOMPANIMENTS[id].label.length).toBeGreaterThan(2)
      expect(ACCOMPANIMENTS[id].feel.length).toBeGreaterThan(20)
    }
  })
})
