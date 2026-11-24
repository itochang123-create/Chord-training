import { reanalyze, transposeResolved, type ResolvedChord } from './chord.ts'
import { mod, type Key } from './pitch.ts'
import { parseProgression, type Grammar, type ParseFailure } from './parse.ts'

export type ResolvedProgression = {
  ok: true
  grammar: Grammar
  chords: ResolvedChord[]
  /** Semitone rise from the written concrete key to the sounding key. Functional progressions stay at 0. */
  delta: number
}

export function resolveProgression(
  text: string,
  sounding: Key,
  anchor: Key | null,
): ResolvedProgression | ParseFailure {
  const probe = parseProgression(text, sounding)
  if (!probe.ok) return probe
  if (probe.grammar !== 'concrete') {
    return { ok: true, grammar: probe.grammar, chords: probe.chords, delta: 0 }
  }

  const from = anchor ?? sounding
  const sameKey =
    from.tonic.pc === sounding.tonic.pc && from.mode === sounding.mode && from.tonic.name === sounding.tonic.name
  const written = sameKey ? probe : parseProgression(text, from)
  if (!written.ok) return written

  const delta = mod(sounding.tonic.pc - from.tonic.pc)
  const chords =
    delta === 0
      ? written.chords.map((chord) => reanalyze(chord, sounding))
      : written.chords.map((chord) => transposeResolved(chord, delta, sounding))
  return { ok: true, grammar: 'concrete', chords, delta }
}
