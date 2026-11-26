import { describe, expect, test } from 'vitest'
import appSource from '../App.tsx?raw'
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

describe('color buttons stay idiomatic', () => {
  test('the on-screen rule does not color every chord', () => {
    expect(COLOR_RULE).toMatch(/I and IV stay triads/)
    expect(COLOR_RULE).toMatch(/Gsus4 then G/)
    expect(COLOR_RULE).toMatch(/one passing dim7/)
    expect(COLOR_RULE).toMatch(/not a 6th/)
    expect(COLOR_RULE).not.toMatch(/most of the loop/)
  })

  test('1645 with 7 colors vi and V, not I or IV', () => {
    expect(symbols('I–vi–IV–V', { seven: true })).toEqual(['C', 'Am7', 'F', 'G7'])
  })

  test('1645 with 9 colors vi and V, and 11 or 13 color only V', () => {
    expect(symbols('I–vi–IV–V', { nine: true })).toEqual(['C', 'Am9', 'F', 'G9'])
    const eleventh = colored('I–vi–IV–V', { eleven: true })
    expect(eleventh.map((chord) => chord.symbol)).toEqual(['C', 'Am', 'F', 'G11'])
    expect(eleventh[3]?.quality).toBe('dom11')
    const thirteenth = colored('I–vi–IV–V', { thirteen: true })
    expect(thirteenth.map((chord) => chord.symbol)).toEqual(['C', 'Am', 'F', 'G13'])
    expect(thirteenth[3]?.quality).toBe('dom13')
    expect(thirteenth[3]?.tones.some((tone) => tone.degreeLabel === '7th')).toBe(true)
  })

  test('9 replaces 7 on the same idiomatic chords, and ii–V–I does not color the tonic', () => {
    expect(symbols('I–vi–IV–V', { seven: true, nine: true })).toEqual(['C', 'Am9', 'F', 'G9'])
    expect(symbols('ii–V–I', { nine: true, seven: true })).toEqual(['Dm9', 'G9', 'C'])
    expect(symbols('ii–V–I', { eleven: true })).toEqual(['Dm11', 'G11', 'C'])
  })

  test('sus is one dominant that resolves, including when 7 is also on', () => {
    expect(symbols('I–vi–IV–V', { sus: true })).toEqual(['C', 'Am', 'F', 'Gsus4', 'G'])
    expect(symbols('I–vi–IV–V', { sus: true, seven: true })).toEqual(['C', 'Am7', 'F', 'G7sus4', 'G7'])
  })

  test('dim adds one passing dim7 and does not stack another into the tonic', () => {
    expect(symbols('I–vi–IV–V', { dim: true })).toEqual(['C', 'Am', 'F', 'F#dim7', 'G'])
    expect(symbols('I–vi–IV–V', { seven: true, dim: true })).toEqual(['C', 'Am7', 'F', 'F#dim7', 'G7'])
    const already = symbols(PRESETS.find((preset) => preset.id === 'color-passing-dim')!.formula, { dim: true })
    expect(already.filter((symbol) => symbol.includes('dim7'))).toEqual(['C#dim7'])
  })

  test('a custom line colors ii and V, not the tonic', () => {
    expect(symbols('Dm G C', { seven: true })).toEqual(['Dm7', 'G7', 'C'])
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

  test('Play sits above the Practice tab and is not repeated under the keyboard', () => {
    const transport = appSource.indexOf('<Transport')
    const practice = appSource.indexOf("? 'Practice'")
    expect(transport).toBeGreaterThan(-1)
    expect(transport).toBeLessThan(practice)
    expect(appSource.indexOf('<Transport', transport + 1)).toBe(-1)
  })

  test('the accompaniment menu keeps the original patterns and adds the larger set', () => {
    for (const id of ['audition', 'block', 'bass-chord', 'arpeggio', 'alberti', 'waltz', 'ballad'] as const) {
      expect(ACCOMPANIMENT_IDS).toContain(id)
    }
    for (const id of ['swing', 'boogie', 'jump', 'bebop', 'stride', 'walking', 'pedal', 'broken-octaves', 'rolled', 'pop-eighths', 'rock', 'hymn', 'jazz', 'gospel', 'bossa', 'march', 'tremolo', 'tresillo'] as const) {
      expect(ACCOMPANIMENT_IDS).toContain(id)
    }
    expect(new Set(ACCOMPANIMENT_IDS).size).toBe(ACCOMPANIMENT_IDS.length)
    for (const id of ACCOMPANIMENT_IDS) {
      expect(ACCOMPANIMENTS[id].label.length).toBeGreaterThan(2)
      expect(ACCOMPANIMENTS[id].feel.length).toBeGreaterThan(20)
    expect(ACCOMPANIMENT_IDS.indexOf('swing')).toBeLessThan(8)
    expect(ACCOMPANIMENTS.swing.label).toBe('Swing shuffle')
    expect(ACCOMPANIMENTS.swing.feel).toBe('Swung eighths. Bass on 1 and 3, a short chord on the offbeat.')
    const swingAt = ACCOMPANIMENT_IDS.indexOf('swing')
    expect(ACCOMPANIMENT_IDS.slice(swingAt, swingAt + 4)).toEqual(['swing', 'boogie', 'jump', 'bebop'])
    expect(ACCOMPANIMENTS.boogie.label).toBe('Boogie-woogie')
    expect(ACCOMPANIMENTS.jump.label).toBe('Jump blues')
    expect(ACCOMPANIMENTS.bebop.label).toBe('Bebop comp')
    }
  })
})
