import {
  bassFromFigure,
  diatonicTriad,
  parseQualityBody,
  type Figure,
  type Triad,
} from './quality.ts'
import {
  degreeToSpelled,
  makeKey,
  parseAccidental,
  spell,
  type Degree,
  type Key,
  type Letter,
  type Mode,
  type Spelled,
} from './pitch.ts'
import { realize, type QualityId, type ResolvedChord } from './chord.ts'

export type Grammar = 'roman' | 'number' | 'concrete'

export type ParseSuccess = {
  ok: true
  grammar: Grammar
  chords: ResolvedChord[]
}

export type ParseFailure = {
  ok: false
  error: string
  token?: string
}

export type ParseResult = ParseSuccess | ParseFailure

const NICKNAMES: Record<string, string> = {
  '1564': '1564 means I–V–vi–IV. Write it with separators: I–V–vi–IV or 1-5-6-4.',
  '1645': '1645 means I–vi–IV–V. It is not 1564. Write I–vi–IV–V or 1-6-4-5.',
  '6415': '6415 means vi–IV–I–V. Write vi–IV–I–V or 6-4-1-5.',
  '4536': '4536 means IV–V–iii–vi, the Royal Road. Write IV–V–iii–vi or 4-5-3-6.',
  '251': '251 means ii–V–I. Write ii–V–I or 2-5-1.',
}

const CONCRETE_RE = /^([A-G])(bb|##|♭♭|♯♯|x|#|b|♯|♭)?(.*)$/
const ROMAN_RE =
  /^((?:bb|##|♭♭|♯♯|b|#|♭|♯)?)(VII|III|II|VI|IV|V|I|vii|iii|ii|vi|iv|v|i)(.*)$/
const NUMBER_RE = /^((?:bb|##|♭♭|♯♯|b|#|♭|♯)?)([1-7])(.*)$/

const ROMAN_DEGREE: Record<string, Degree> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
}

export const GRAMMAR_HELP = {
  roman: 'I–V–vi–IV, ii9–V13–Imaj9, V7sus4–V7–Imaj7, I–#I°7–ii7–V7, V6',
  numbers: '1-5-6-4, 6-4-1-5, 1-6-4-5, 5/7, 57, 513',
  concrete: 'C G Am F, Em C G D/F#, Dm9 G13 Cmaj9, C C#dim7 Dm7 G7, G7sus4 G7 Cmaj7, C6, C13',
  rules: [
    'Separators are spaces, commas, hyphens, or dashes. 1564 is not a chord: write 1-5-6-4.',
    'On a Roman numeral, 6 and 64 mean first and second inversion. I6 is not a sixth chord; write Iadd6.',
    'On a number or a chord symbol, 6 means an added sixth. C6 is C E G A. C13 keeps the flat 7th, so it is not C6. Inversion uses a slash: D/F#.',
    'Cdim7 stacks a diminished 7th (9 semitones). Cm7b5 is half-diminished: the 7th is minor (10 semitones).',
    'Quality belongs to that chord. Dm9–G13–Cmaj9 does not make the C chord a 13th.',
    'A slash on a Roman numeral or number is a scale degree in the bass. In G, V/7 and 5/7 put F# under a D chord.',
    'A slash on a chord symbol is a note name. D/F# is D with F# in the bass: first inversion, because F# is the 3rd.',
    'C/B is a C triad with a B that is not in the chord: a non-chord slash bass, not an inversion. Cmaj7/B is third inversion.',
    'Hyphens separate chords. Write Cm7, not C-7. sis2 and sis4 mean sus2 and sus4.',
    'Case picks the triad for Roman numerals: V is major, v is minor. In a minor key, III is a minor third up (Eb in C minor).',
    'Numbers follow the key. In major, 6 is minor; in natural minor, 5 is minor and 3 is major. Write 5maj or V for a major dominant.',
    'A flat or sharp before a number borrows that root as a major triad. b7 in C is Bb, not diminished.',
  ],
}

export function parseProgression(input: string, key: Key): ParseResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return {
      ok: false,
      error: 'Enter a progression. For example: vi–IV–I–V, 1-5-6-4, or Em C G D/F#.',
    }
  }
  if (trimmed.length > 500) {
    return { ok: false, error: 'Keep the progression under 500 characters.' }
  }
  if (NICKNAMES[trimmed]) {
    return { ok: false, error: NICKNAMES[trimmed] }
  }

  let tokens: string[]
  try {
    tokens = tokenize(trimmed)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Could not read that progression.' }
  }
  if (tokens.length === 0) {
    return { ok: false, error: 'Enter at least one chord.' }
  }

  const parsed: Array<{ grammar: Grammar; chord: ResolvedChord; token: string }> = []
  for (const token of tokens) {
    const one = parseToken(token, key)
    if (!one.ok) return one
    parsed.push({ grammar: one.grammar, chord: one.chord, token })
  }
  const kinds = new Set(parsed.map((item) => item.grammar))
  if (kinds.size > 1) {
    return {
      ok: false,
      error: `Don't mix chord symbols with Roman numerals or numbers (${parsed.map((item) => item.token).join(' ')}). Concrete: Em C G D/F#. Roman: vi–IV–I–V6. Numbers: 6-4-1-5.`,
    }
  }
  return { ok: true, grammar: parsed[0].grammar, chords: parsed.map((item) => item.chord) }
}

function tokenize(input: string): string[] {
  const primary = input
    .split(/[\s,|–—→>]+/)
    .map((part) => part.trim())
    .filter(Boolean)
  const tokens: string[] = []
  for (const part of primary) {
    if (!part.includes('-')) {
      tokens.push(part)
      continue
    }
    const pieces = part.split('-')
    if (pieces.some((piece) => piece.length === 0)) {
      throw new Error(`Empty chord in "${part}". Hyphens separate chords: I-V-vi-IV.`)
    }
    for (let index = 1; index < pieces.length; index += 1) {
      if (/^(7|9|11|13)$/.test(pieces[index]) && !looksLikeNumber(pieces[index - 1])) {
        throw new Error(
          `"${part}" uses a hyphen before ${pieces[index]}. Hyphens separate chords (C-F-G or 1-5-6-4). For minor 7 write Cm7, not C-7.`,
        )
      }
    }
    tokens.push(...pieces)
  }
  return tokens
}

function looksLikeNumber(token: string): boolean {
  return /^(?:bb|##|♭♭|♯♯|b|#|♭|♯)?[1-7]/.test(token)
}

function parseToken(token: string, key: Key): { ok: true; grammar: Grammar; chord: ResolvedChord } | ParseFailure {
  if (/^\d{4,}$/.test(token)) {
    return {
      ok: false,
      token,
      error:
        NICKNAMES[token] ??
        `"${token}" needs separators: ${token.split('').join('-')}. 1564 is I–V–vi–IV and 1645 is I–vi–IV–V.`,
    }
  }
  if (/^\d{3}$/.test(token) && !/^[1-7](?:11|13)$/.test(token)) {
    return {
      ok: false,
      token,
      error: `"${token}" needs separators: ${token.split('').join('-')}. 511 is an 11th on degree 5, and 513 is a 13th. Other glued numbers need hyphens.`,
    }
  }

  if (CONCRETE_RE.test(token) && !ROMAN_RE.test(token)) {
    return parseConcrete(token, key)
  }
  if (ROMAN_RE.test(token)) return parseRoman(token, key)
  if (NUMBER_RE.test(token)) return parseNumber(token, key)
  return {
    ok: false,
    token,
    error: `No chord named "${token}". Use a Roman numeral (vi, V7, V6), a number (6, 5maj7, 5/7), or a symbol (Am, D/F#).`,
  }
}

function parseConcrete(token: string, key: Key): { ok: true; grammar: Grammar; chord: ResolvedChord } | ParseFailure {
  const match = token.match(CONCRETE_RE)
  if (!match) return { ok: false, token, error: `No chord named "${token}".` }
  const accidental = parseAccidental(match[2] ?? '')
  if (accidental == null) return { ok: false, token, error: `Can't read the accidental in "${token}".` }
  const root = spell(match[1] as Letter, accidental)
  const slash = splitSlash(match[3] ?? '')
  if (slash.error) return { ok: false, token, error: slash.error }
  const quality = parseQualityBody(slash.body, 'concrete', 'maj')
  if ('error' in quality) return { ok: false, token, error: `${quality.error} (in "${token}")` }
  if (quality.figure) {
    return {
      ok: false,
      token,
      error: `Figured bass is for Roman numerals (V6, I64). On chord symbols, name the bass note: D/F# or C/G. (in "${token}")`,
    }
  }
  const bass = slash.slash == null ? root : parseNote(slash.slash)
  if ('error' in bass) return { ok: false, token, error: `${bass.error} (in "${token}")` }
  return { ok: true, grammar: 'concrete', chord: realize(root, quality.quality, bass, key) }
}

function parseRoman(token: string, key: Key): { ok: true; grammar: Grammar; chord: ResolvedChord } | ParseFailure {
  const match = token.match(ROMAN_RE)
  if (!match) return { ok: false, token, error: `No chord named "${token}".` }
  const alteration = parseAccidental(match[1] ?? '')
  if (alteration == null) return { ok: false, token, error: `Can't read the accidental in "${token}".` }
  const numeral = match[2]
  const degree = ROMAN_DEGREE[numeral.toUpperCase()]
  const base: Triad = numeral === numeral.toUpperCase() ? 'maj' : 'min'
  const slash = splitSlash(match[3] ?? '')
  if (slash.error) return { ok: false, token, error: slash.error }
  const quality = parseQualityBody(slash.body, 'roman', base)
  if ('error' in quality) return { ok: false, token, error: `${quality.error} (in "${token}")` }
  if (slash.slash != null && quality.figure) {
    return { ok: false, token, error: `Use either figured bass or a slash in "${token}", not both.` }
  }
  const root = degreeToSpelled(degree, alteration, key)
  const bass = bassFor(root, quality.quality, quality.figure, slash.slash, key)
  if ('error' in bass) return { ok: false, token, error: `${bass.error} (in "${token}")` }
  return { ok: true, grammar: 'roman', chord: realize(root, quality.quality, bass, key) }
}

function parseNumber(token: string, key: Key): { ok: true; grammar: Grammar; chord: ResolvedChord } | ParseFailure {
  const match = token.match(NUMBER_RE)
  if (!match) return { ok: false, token, error: `No chord named "${token}".` }
  const alteration = parseAccidental(match[1] ?? '')
  if (alteration == null) return { ok: false, token, error: `Can't read the accidental in "${token}".` }
  const degree = Number(match[2]) as Degree
  const slash = splitSlash(match[3] ?? '')
  if (slash.error) return { ok: false, token, error: slash.error }
  // Altered numbers borrow a major triad. Unaltered numbers use the mode's diatonic triad.
  const base: Triad = alteration === 0 ? diatonicTriad(degree, key.mode) : 'maj'
  const quality = parseQualityBody(slash.body, 'number', base)
  if ('error' in quality) return { ok: false, token, error: `${quality.error} (in "${token}")` }
  const root = degreeToSpelled(degree, alteration, key)
  const bass = bassFor(root, quality.quality, quality.figure, slash.slash, key)
  if ('error' in bass) return { ok: false, token, error: `${bass.error} (in "${token}")` }
  return { ok: true, grammar: 'number', chord: realize(root, quality.quality, bass, key) }
}

function bassFor(
  root: Spelled,
  quality: QualityId,
  figure: Figure | null,
  slash: string | null,
  key: Key,
): Spelled | { error: string } {
  if (slash != null) {
    const parsed = parseScaleDegree(slash, key)
    if ('error' in parsed) return parsed
    return parsed
  }
  return bassFromFigure(root, quality, figure)
}

function splitSlash(body: string): { body: string; slash: string | null; error?: string } {
  const index = body.indexOf('/')
  if (index < 0) return { body, slash: null }
  if (body.indexOf('/', index + 1) >= 0) return { body, slash: null, error: 'Only one slash bass is allowed.' }
  const slash = body.slice(index + 1)
  if (!slash) return { body, slash: null, error: 'Add a bass after the slash, such as D/F# or V/7.' }
  return { body: body.slice(0, index), slash }
}

function parseNote(token: string): Spelled | { error: string } {
  const match = token.match(/^([A-G])(bb|##|♭♭|♯♯|x|#|b|♯|♭)?$/)
  if (!match) {
    return { error: `Bass "${token}" should be a note name like F# or Bb.` }
  }
  const accidental = parseAccidental(match[2] ?? '')
  if (accidental == null) return { error: `Can't read the accidental in "${token}".` }
  return spell(match[1] as Letter, accidental)
}

function parseScaleDegree(token: string, key: Key): Spelled | { error: string } {
  const match = token.match(/^((?:bb|##|♭♭|♯♯|b|#|♭|♯)?)([1-7])$/)
  if (!match) {
    if (/[A-Ga-g]|[ivIV]/.test(token)) {
      return {
        error: `Slash "${token}" is not a scale degree. Secondary dominants (V/vi) are not supported. Use V/7 or 5/7 for a scale-degree bass, or a chord symbol like D/F# for a note-name bass.`,
      }
    }
    return { error: `Slash bass "${token}" should be a scale degree from 1 to 7.` }
  }
  const alteration = parseAccidental(match[1] ?? '')
  if (alteration == null) return { error: `Can't read the accidental in "${token}".` }
  return degreeToSpelled(Number(match[2]) as Degree, alteration, key)
}

export function parseInKey(input: string, tonic: string, mode: Mode): ParseResult {
  return parseProgression(input, makeKey(tonic, mode))
}
