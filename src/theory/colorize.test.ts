import { describe, expect, test } from 'vitest'
import setupSource from '../components/Setup.tsx?raw'
import { PRESETS } from './catalog.ts'
import { applyColors, COLOR_RULE, EMPTY_COLORS, type ColorFlags } from './colorize.ts'
import { makeKey } from './pitch.ts'
import { parseInKey } from './parse.ts'

const key = makeKey('C', 'major')

function symbols(formula: string, flags: Partial<ColorFlags> = {}) {
  const parsed = parseInKey(formula, 'C', 'major')
  if (!parsed.ok) throw new Error(parsed.error)
  return applyColors(parsed.chords, key, { ...EMPTY_COLORS, ...flags }).map((chord) => chord.symbol)
}

describe('color buttons change one place in the loop', () => {
  test('the rule is shown in words', () => {
    expect(COLOR_RULE).toMatch(/once, not on every chord/)
    expect(COLOR_RULE).toMatch(/passing dim7/)
  })

  test('7 turns only V into a seventh', () => {
    expect(symbols('I–vi–IV–V', { seven: true })).toEqual(['C', 'Am', 'F', 'G7'])
  })

  test('9 sits on ii, and with 7 the dominant is still a seventh', () => {
    expect(symbols('ii–V–I', { nine: true })).toEqual(['Dm9', 'G', 'C'])
    expect(symbols('ii–V–I', { nine: true, seven: true })).toEqual(['Dm9', 'G7', 'C'])
  })

  test('9 uses V when the loop has no ii', () => {
    expect(symbols('I–vi–IV–V', { nine: true })).toEqual(['C', 'Am', 'F', 'G9'])
  })

  test('11 sits on IV', () => {
    expect(symbols('I–vi–IV–V', { eleven: true })).toEqual(['C', 'Am', 'F11', 'G'])
  })

  test('13 sits on V and already supplies the 7', () => {
    expect(symbols('I–vi–IV–V', { thirteen: true, seven: true })).toEqual(['C', 'Am', 'F', 'G13'])
  })

  test('sus sits on the dominant and becomes 7sus4 when 7 is also on', () => {
    expect(symbols('I–vi–IV–V', { sus: true })).toEqual(['C', 'Am', 'F', 'Gsus4'])
    expect(symbols('I–vi–IV–V', { sus: true, seven: true })).toEqual(['C', 'Am', 'F', 'G7sus4'])
  })

  test('dim inserts one passing dim7 and leaves the other chords', () => {
    expect(symbols('I–vi–IV–V', { dim: true })).toEqual(['C', 'C#dim7', 'Am', 'F', 'G'])
    const colored = symbols(PRESETS.find((preset) => preset.id === 'color-passing-dim')!.formula, { dim: true })
    expect(colored.filter((symbol) => symbol.includes('dim7'))).toHaveLength(1)
  })

  test('buttons also recolor a custom line', () => {
    expect(symbols('Dm G C', { seven: true })).toEqual(['Dm', 'G7', 'C'])
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
})
