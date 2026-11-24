import { describe, expect, test } from 'vitest'
import { EDITORIAL_NOTE, PRESETS } from './catalog.ts'
import {
  describeBass,
  formatChordSymbol,
  joinSymbols,
  soundingPcs,
  theoreticalPcs,
  voicePractice,
  voiceProgression,
  VOICING_OMISSION_SUMMARY,
  type ResolvedChord,
} from './chord.ts'
import { makeKey, prettify, spelledScale } from './pitch.ts'
import { parseInKey, parseProgression } from './parse.ts'
import { resolveProgression } from './resolve.ts'

function chords(text: string, tonic = 'C', mode: 'major' | 'minor' = 'major'): ResolvedChord[] {
  const parsed = parseInKey(text, tonic, mode)
  if (!parsed.ok) throw new Error(parsed.error)
  return parsed.chords
}

function symbols(text: string, tonic = 'C', mode: 'major' | 'minor' = 'major'): string[] {
  return chords(text, tonic, mode).map((chord) => chord.symbol)
}

function names(chord: ResolvedChord): string[] {
  return chord.tones.map((tone) => tone.name)
}

function pcs(chord: ResolvedChord): number[] {
  return theoreticalPcs(chord)
}

describe('scale mapping', () => {
  test('major diatonic triads in C', () => {
    expect(symbols('I ii iii IV V vi vii°')).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'])
    expect(names(chords('I')[0])).toEqual(['C', 'E', 'G'])
    expect(names(chords('iii')[0])).toEqual(['E', 'G', 'B'])
    expect(names(chords('vii°')[0])).toEqual(['B', 'D', 'F'])
  })

  test('natural minor and the major dominant in C minor', () => {
    expect(symbols('i ii° III iv v VI VII', 'C', 'minor')).toEqual([
      'Cm',
      'Ddim',
      'Eb',
      'Fm',
      'Gm',
      'Ab',
      'Bb',
    ])
    expect(names(chords('III', 'C', 'minor')[0])).toEqual(['Eb', 'G', 'Bb'])
    expect(names(chords('v', 'C', 'minor')[0])).toEqual(['G', 'Bb', 'D'])
    expect(names(chords('V', 'C', 'minor')[0])).toEqual(['G', 'B', 'D'])
    expect(names(chords('VII', 'C', 'minor')[0])).toEqual(['Bb', 'D', 'F'])
  })

  test('A minor V spells the raised leading tone as G#', () => {
    expect(names(chords('V', 'A', 'minor')[0])).toEqual(['E', 'G#', 'B'])
  })

  test('uppercase II is major even when the diatonic chord is minor', () => {
    expect(symbols('II')).toEqual(['D'])
    expect(names(chords('II')[0])).toEqual(['D', 'F#', 'A'])
  })

  test('the natural minor scale in C is C D Eb F G Ab Bb', () => {
    expect(spelledScale(makeKey('C', 'minor')).map((note) => note.name)).toEqual([
      'C',
      'D',
      'Eb',
      'F',
      'G',
      'Ab',
      'Bb',
    ])
  })
})

describe('extensions, sus, and sis', () => {
  test('theoretical pitch classes', () => {
    expect(pcs(chords('Cmaj7')[0])).toEqual([0, 4, 7, 11])
    expect(pcs(chords('C7')[0])).toEqual([0, 4, 7, 10])
    expect(pcs(chords('Cm7')[0])).toEqual([0, 3, 7, 10])
    expect(pcs(chords('C6')[0])).toEqual([0, 4, 7, 9])
    expect(pcs(chords('Cm6')[0])).toEqual([0, 3, 7, 9])
    expect(pcs(chords('C9')[0])).toEqual([0, 2, 4, 7, 10])
    expect(pcs(chords('Cmaj9')[0])).toEqual([0, 2, 4, 7, 11])
    expect(pcs(chords('Cm9')[0])).toEqual([0, 2, 3, 7, 10])
    expect(pcs(chords('C11')[0])).toEqual([0, 2, 4, 5, 7, 10])
    expect(pcs(chords('Csus2')[0])).toEqual([0, 2, 7])
    expect(pcs(chords('Csus4')[0])).toEqual([0, 5, 7])
    expect(names(chords('C7')[0])).toEqual(['C', 'E', 'G', 'Bb'])
    expect(names(chords('F#')[0])).toEqual(['F#', 'A#', 'C#'])
  })

  test('sis is sus, and it is not a silent typo', () => {
    const sus = chords('Csus4')[0]
    const sis = chords('Csis4')[0]
    expect(pcs(sis)).toEqual(pcs(sus))
    expect(sis.symbol).toBe('Csus4')
    expect(chords('Csis2')[0].symbol).toBe('Csus2')
    expect(chords('Csis')[0].symbol).toBe('Csus4')
    expect(symbols('Isus4')).toEqual(['Csus4'])
    expect(symbols('Isis2')).toEqual(['Csus2'])
  })

  test('9ths omit the 5th and 11ths omit the 3rd and the 5th when sounded', () => {
    const c9 = voiceProgression(chords('C9'), 'root')[0]
    expect(soundingPcs(c9)).toEqual([0, 2, 4, 10])
    expect(c9.chord.omission).toMatch(/5th/)
    const c11 = voiceProgression(chords('C11'), 'root')[0]
    expect(soundingPcs(c11)).toEqual([0, 2, 5, 10])
    expect(pcs(c11.chord)).toContain(4)
    expect(soundingPcs(c11)).not.toContain(4)
    expect(c11.chord.omission).toMatch(/3rd/)
    expect(VOICING_OMISSION_SUMMARY).toMatch(/11ths leave out the 3rd/)
    expect(voiceProgression(chords('C'), 'root')[0].chord.omission).toBeNull()
    expect(soundingPcs(voiceProgression(chords('C7'), 'root')[0])).toEqual([0, 4, 7, 10])
  })

  test('C13 keeps the flat 7th and is not C6', () => {
    const thirteenth = chords('C13')[0]
    const sixth = chords('C6')[0]
    expect(thirteenth.quality).toBe('dom13')
    expect(sixth.quality).toBe('maj6')
    expect(pcs(thirteenth)).toEqual([0, 2, 4, 7, 9, 10])
    expect(pcs(thirteenth)).toContain(10)
    expect(pcs(sixth)).not.toContain(10)
    const sounded = soundingPcs(voiceProgression([thirteenth], 'root')[0])
    expect(sounded).toContain(10)
    expect(sounded).toContain(9)
    expect(sounded).not.toContain(7)
    expect(thirteenth.omission).toMatch(/not C6/)
    expect(chords('Cmaj13')[0].quality).toBe('maj13')
    expect(chords('Cm13')[0].quality).toBe('min13')
    expect(parseInKey('Csus13', 'C', 'major').ok).toBe(false)
    expect(parseInKey('Cdim13', 'C', 'major').ok).toBe(false)
  })

  test('dim7 is a diminished seventh and m7b5 is a minor seventh', () => {
    const diminished = chords('Cdim7')[0]
    const half = chords('Cm7b5')[0]
    expect(pcs(diminished)).toEqual([0, 3, 6, 9])
    expect(pcs(half)).toEqual([0, 3, 6, 10])
    const dimSeventh = diminished.tones.find((tone) => tone.degreeLabel === '7th')
    const halfSeventh = half.tones.find((tone) => tone.degreeLabel === '7th')
    expect(dimSeventh && (dimSeventh.pc - diminished.root.pc + 12) % 12).toBe(9)
    expect(halfSeventh && (halfSeventh.pc - half.root.pc + 12) % 12).toBe(10)
  })

  test('7sus4 has no third, and sus4 has no seventh', () => {
    const suspended = chords('G7sus4')[0]
    expect(suspended.quality).toBe('dom7sus4')
    expect(suspended.symbol).toBe('G7sus4')
    expect(pcs(suspended)).toEqual([0, 2, 5, 7])
    expect(pcs(suspended)).not.toContain(11)
    expect(pcs(chords('Gsus4')[0])).toEqual([0, 2, 7])
    expect(pcs(chords('G7')[0])).toContain(11)
  })

  test('quality stays on the chord that asks for it', () => {
    expect(chords('Dm9 G13 Cmaj9').map((chord) => chord.quality)).toEqual(['min9', 'dom13', 'maj9'])
    expect(symbols('Dm9 G13 Cmaj9')).toEqual(['Dm9', 'G13', 'Cmaj9'])
    expect(symbols('C C#dim7 Dm7 G7')).toEqual(['C', 'C#dim7', 'Dm7', 'G7'])
    expect(symbols('G7sus4 G7 Cmaj7')).toEqual(['G7sus4', 'G7', 'Cmaj7'])
    expect(symbols('ii9–V13–Imaj9')).toEqual(['Dm9', 'G13', 'Cmaj9'])
    expect(symbols('I #I°7 ii7 V7')).toEqual(['C', 'C#dim7', 'Dm7', 'G7'])
    expect(symbols('V7sus4–V7–Imaj7')).toEqual(['G7sus4', 'G7', 'Cmaj7'])
    const rewritten = ['C', formatChordSymbol('D', 'min9', null), 'G'].join(' ')
    expect(chords(rewritten).map((chord) => [chord.symbol, chord.quality])).toEqual([
      ['C', 'maj'],
      ['Dm9', 'min9'],
      ['G', 'maj'],
    ])
  })
})

describe('slash bass, inversion, and the right hand', () => {
  test('D/F# is D in first inversion with F# in the bass', () => {
    const chord = chords('D/F#', 'G')[0]
    expect(chord.symbol).toBe('D/F#')
    expect(chord.bass.name).toBe('F#')
    expect(chord.bassRole).toEqual({ kind: 'inversion', inversion: 1, degreeLabel: '3rd' })
    expect(chord.roman).toBe('V6')
    const voiced = voiceProgression([chord], 'root')[0]
    expect(voiced.bassMidi % 12).toBe(6)
    expect(voiced.bassMidi).toBeLessThan(60)
    expect(voiced.rhMidis[0] % 12).toBe(2)
    expect(Math.min(...voiced.rhMidis)).toBeGreaterThanOrEqual(60)
    expect(describeBass(chord, voiced.sounding[0].name)).toMatch(/First inversion/)
    expect(describeBass(chord, voiced.sounding[0].name)).toMatch(/3rd/)
    expect(voiced.rhLabel).toMatch(/Root position/)
    expect(voiced.rhLabel).not.toMatch(/slash bass/)
  })

  test('a bass inversion is not the same thing as a right-hand inversion', () => {
    const chord = chords('D/F#', 'D')[0]
    const rootHand = voiceProgression([chord], 'root')[0]
    const secondHand = voiceProgression([chord], 'second')[0]
    expect(rootHand.bassMidi % 12).toBe(secondHand.bassMidi % 12)
    expect(rootHand.rhMidis[0] % 12).toBe(2)
    expect(secondHand.rhMidis[0] % 12).toBe(9)
    expect(secondHand.rhLabel).toMatch(/Second inversion/)
  })

  test('C/E is first inversion and C/G is second inversion', () => {
    expect(chords('C/E')[0].bassRole).toMatchObject({ kind: 'inversion', inversion: 1, degreeLabel: '3rd' })
    expect(chords('C/G')[0].bassRole).toMatchObject({ kind: 'inversion', inversion: 2, degreeLabel: '5th' })
    expect(symbols('I6 I64')).toEqual(['C/E', 'C/G'])
  })

  test('C/B and Am/G are non-chord slash basses; Cmaj7/B is third inversion', () => {
    const slash = chords('C/B')[0]
    expect(slash.bassRole).toEqual({ kind: 'non-chord' })
    expect(describeBass(slash, 'B3')).toMatch(/Non-chord slash bass/)
    expect(describeBass(slash, 'B3')).not.toMatch(/inversion/)
    expect(chords('Am/G')[0].bassRole).toEqual({ kind: 'non-chord' })
    expect(chords('Cmaj7/B')[0].bassRole).toEqual({ kind: 'inversion', inversion: 3, degreeLabel: '7th' })
    expect(chords('Cmaj7/B')[0].symbol).toBe('Cmaj7/B')
  })

  test('an enharmonic bass spelling is still the chord tone it sounds', () => {
    const chord = chords('D/Gb', 'G')[0]
    expect(chord.bass.name).toBe('F#')
    expect(chord.bassRole).toMatchObject({ kind: 'inversion', inversion: 1 })
    expect(chord.symbol).toBe('D/F#')
  })

  test('sus slash bass is a chord tone, not a triad inversion', () => {
    const chord = chords('Csus4/F')[0]
    expect(chord.bassRole).toEqual({ kind: 'chord-tone', degreeLabel: '4th' })
    expect(describeBass(chord, 'F3')).toMatch(/not a classical triad inversion/)
  })

  test('in G, V/7 and 5/7 are D/F#', () => {
    expect(symbols('V/7', 'G')).toEqual(['D/F#'])
    expect(symbols('5/7', 'G')).toEqual(['D/F#'])
    expect(chords('5/7', 'G')[0].bassRole).toMatchObject({ kind: 'inversion', inversion: 1 })
  })

  test('V65 is a first-inversion dominant seventh', () => {
    const chord = chords('V65')[0]
    expect(chord.symbol).toBe('G7/B')
    expect(chord.roman).toBe('V65')
    expect(chord.bassRole).toMatchObject({ kind: 'inversion', inversion: 1, degreeLabel: '3rd' })
  })
})

describe('the G to C regression', () => {
  test('functional vi–IV–I–V6 in G is Em–C–G–D/F# and in C is Am–F–C–G/B', () => {
    expect(symbols('vi–IV–I–V6', 'G')).toEqual(['Em', 'C', 'G', 'D/F#'])
    expect(symbols('vi–IV–I–V6', 'C')).toEqual(['Am', 'F', 'C', 'G/B'])
    expect(chords('vi–IV–I–V6', 'C')[3].bass.name).toBe('B')
    expect(chords('vi–IV–I–V6', 'C')[3].bassRole).toMatchObject({ kind: 'inversion', inversion: 1 })
  })

  test('concrete Em C G D/F# transposed from G to C is Am–F–C–G/B', () => {
    const resolved = resolveProgression('Em C G D/F#', makeKey('C', 'major'), makeKey('G', 'major'))
    if (!resolved.ok) throw new Error(resolved.error)
    expect(joinSymbols(resolved.chords)).toBe('Am–F–C–G/B')
    expect(resolved.delta).toBe(5)
    expect(resolved.chords[3].bass.name).toBe('B')
    expect(resolved.chords[3].bassRole).toMatchObject({ kind: 'inversion', inversion: 1, degreeLabel: '3rd' })
    const hand = voiceProgression([resolved.chords[3]], 'root')[0]
    expect(hand.bassMidi % 12).toBe(11)
    expect(hand.rhMidis[0] % 12).toBe(7)
    expect(hand.bassMidi).toBeLessThan(Math.min(...hand.rhMidis))
  })
})

describe('numbers versus nicknames', () => {
  test('1-6-4-5 is 1645 and 1-5-6-4 is 1564', () => {
    expect(symbols('1-6-4-5')).toEqual(['C', 'Am', 'F', 'G'])
    expect(symbols('1-5-6-4')).toEqual(['C', 'G', 'Am', 'F'])
    expect(symbols('6-4-1-5')).toEqual(['Am', 'F', 'C', 'G'])
    expect(chords('1-6-4-5').map((chord) => chord.roman)).toEqual(['I', 'vi', 'IV', 'V'])
    expect(chords('1-5-6-4').map((chord) => chord.roman)).toEqual(['I', 'V', 'vi', 'IV'])
  })

  test('minor numbers follow the natural minor triad until the suffix says otherwise', () => {
    expect(symbols('1 6 3 7', 'A', 'minor')).toEqual(['Am', 'F', 'C', 'G'])
    expect(symbols('5', 'A', 'minor')).toEqual(['Em'])
    expect(symbols('5maj', 'A', 'minor')).toEqual(['E'])
    expect(symbols('b7')).toEqual(['Bb'])
  })

  test('glued nicknames are rejected instead of being parsed as one chord', () => {
    const sixteen = parseProgression('1564', makeKey('C', 'major'))
    const sixteenFour = parseProgression('1645', makeKey('C', 'major'))
    expect(sixteen.ok).toBe(false)
    expect(sixteenFour.ok).toBe(false)
    if (!sixteen.ok) expect(sixteen.error).toMatch(/I–V–vi–IV/)
    if (!sixteenFour.ok) {
      expect(sixteenFour.error).toMatch(/I–vi–IV–V/)
      expect(sixteenFour.error).toMatch(/not 1564/)
    }
  })
})

describe('parser failures stay visible', () => {
  test('rejects empty input, unknown tokens, mixed grammars, jazz minus, and secondary dominants', () => {
    expect(parseProgression('   ', makeKey('C', 'major')).ok).toBe(false)
    const unknown = parseProgression('H7', makeKey('C', 'major'))
    expect(unknown.ok).toBe(false)
    if (!unknown.ok) expect(unknown.error).toMatch(/H7/)
    const mixed = parseProgression('I C', makeKey('C', 'major'))
    expect(mixed.ok).toBe(false)
    if (!mixed.ok) expect(mixed.error).toMatch(/Don't mix/)
    const minus = parseProgression('C-7', makeKey('C', 'major'))
    expect(minus.ok).toBe(false)
    if (!minus.ok) expect(minus.error).toMatch(/Cm7/)
    const secondary = parseProgression('V/vi', makeKey('C', 'major'))
    expect(secondary.ok).toBe(false)
    if (!secondary.ok) expect(secondary.error).toMatch(/Secondary dominants/)
    const junk = parseProgression('Ixyz', makeKey('C', 'major'))
    expect(junk.ok).toBe(false)
  })

  test('hyphens between real chords still parse', () => {
    expect(symbols('I-V-vi-IV')).toEqual(['C', 'G', 'Am', 'F'])
    expect(symbols('Em-C-G-D/F#', 'G')).toEqual(['Em', 'C', 'G', 'D/F#'])
    expect(symbols('1-7')).toEqual(['C', 'Bdim'])
  })
})

describe('catalog', () => {
  test('1645 is never labeled 1564, and the order is explicitly editorial', () => {
    const sixteen = PRESETS.find((preset) => preset.nickname === '1564')
    const sixteenFour = PRESETS.find((preset) => preset.id === '1645')
    const six = PRESETS.find((preset) => preset.nickname === '6415')
    expect(sixteen?.formula).toBe('I–V–vi–IV')
    expect(sixteenFour?.formula).toBe('I–vi–IV–V')
    expect(six?.formula).toBe('vi–IV–I–V')
    expect(PRESETS.some((preset) => preset.nickname === '1564' && preset.formula === 'I–vi–IV–V')).toBe(false)
    expect(EDITORIAL_NOTE).toMatch(/editorial starting point/)
    expect(EDITORIAL_NOTE).toMatch(/not a measured frequency/)
    expect(PRESETS.map((preset) => preset.id).slice(0, 2)).toEqual(['1645', 'descending-bass'])
    expect(PRESETS[0]?.nickname).toContain('1 6 4 5')
    expect(PRESETS[1]?.title).toMatch(/Descending bass/)
    expect(PRESETS[1]?.nickname).toMatch(/Canon|卡農/)
  })

  test('every preset parses to the advertised chords', () => {
    expect(symbols(PRESETS.find((preset) => preset.id === 'canon')!.formula)).toHaveLength(8)
    expect(symbols(PRESETS.find((preset) => preset.id === 'royal')!.formula)).toEqual(['F', 'G', 'Em', 'Am'])
    expect(symbols(PRESETS.find((preset) => preset.id === '1645')!.formula)).toEqual(['C', 'Am', 'F', 'G'])
    const descent = chords(PRESETS.find((preset) => preset.id === 'descending-bass')!.formula)
    expect(descent.map((chord) => chord.symbol)).toEqual(['C', 'G/B', 'Am', 'Em/G', 'F', 'C/E', 'Dm', 'G'])
    expect(descent.map((chord) => chord.bass.name)).toEqual(['C', 'B', 'A', 'G', 'F', 'E', 'D', 'G'])
    expect(symbols(PRESETS.find((preset) => preset.id === 'bass-walk')!.formula)).toEqual(['Am', 'F', 'C', 'G/B'])
    expect(symbols(PRESETS.find((preset) => preset.id === 'minor-pop')!.formula, 'C', 'minor')).toEqual([
      'Cm',
      'Ab',
      'Eb',
      'Bb',
    ])
    expect(symbols(PRESETS.find((preset) => preset.id === 'minor-cadence')!.formula, 'C', 'minor')).toEqual([
      'Cm',
      'Fm',
      'G',
      'Cm',
    ])
    expect(symbols(PRESETS.find((preset) => preset.id === 'minor-251')!.formula, 'C', 'minor')).toEqual([
      'Dm7b5',
      'G',
      'Cm',
    ])
    for (const preset of PRESETS) {
      const parsed = parseInKey(preset.formula, 'C', preset.mode)
      expect(parsed.ok, preset.id).toBe(true)
    }
  })
})

describe('voice leading', () => {
  test('practice always uses smooth voice leading', () => {
    const voiced = voicePractice(chords('C Am'))
    expect(voiced[0].rhLabel).toMatch(/Smooth voice leading/)
    expect(voiced[1].rhLabel).toMatch(/Smooth voice leading/)
    expect(voiced[0].rhMidis).toEqual([60, 64, 67])
    expect(voiced[1].rhMidis).toEqual([60, 64, 69])
  })

  test('smooth motion from C to Am keeps the common tones', () => {
    const voiced = voiceProgression(chords('C Am'), 'smooth')
    expect(voiced[0].rhMidis).toEqual([60, 64, 67])
    expect(voiced[1].rhMidis).toEqual([60, 64, 69])
    expect(voiced[0].bassMidi).toBeLessThan(Math.min(...voiced[0].rhMidis))
  })

  test('display accidentals stay readable', () => {
    expect(prettify('D/F#')).toBe('D/F♯')
    expect(prettify('Bb')).toBe('B♭')
    expect(prettify('Bm7b5')).toBe('Bm7♭5')
    expect(prettify('bVII')).toBe('♭VII')
  })
})
