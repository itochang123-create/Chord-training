import { describeBass, type VoicedChord } from '../theory/chord.ts'
import { prettify } from '../theory/pitch.ts'

export type RevealedChord = {
  symbol: string
  roman: string
  sounding: string
  bass: string
  rightHand: string
  bassDescription: string
  rhLabel: string
  omission: string | null
  piano: Array<{ midi: number; role: 'bass' | 'rh' }>
}

export type StageModel =
  | { kind: 'hidden'; positionLabel: string }
  | { kind: 'empty'; positionLabel: string; message: string }
  | { kind: 'shown'; positionLabel: string; chord: RevealedChord }

export function stageModel(args: {
  workspace: 'practice' | 'listen'
  revealed: boolean
  chordIndex: number
  chordCount: number
  voiced: VoicedChord | null
}): StageModel {
  const positionLabel =
    args.workspace === 'listen'
      ? `Chord ${args.chordIndex + 1}`
      : `Chord ${args.chordIndex + 1} of ${Math.max(args.chordCount, 1)}`
  if (args.workspace === 'listen' && !args.revealed) return { kind: 'hidden', positionLabel }
  if (!args.voiced) {
    return { kind: 'empty', positionLabel, message: 'This progression is not playable yet. The message under the editor says what to fix.' }
  }
  return { kind: 'shown', positionLabel, chord: reveal(args.voiced) }
}

function reveal(voiced: VoicedChord): RevealedChord {
  const bass = voiced.sounding.find((note) => note.role === 'bass')
  const rightHand = voiced.sounding.filter((note) => note.role === 'rh')
  return {
    symbol: prettify(voiced.chord.symbol),
    roman: prettify(voiced.chord.roman),
    sounding: voiced.sounding.map((note) => prettify(note.name)).join(' · '),
    bass: bass ? prettify(bass.name) : '—',
    rightHand: rightHand.map((note) => prettify(note.name)).join(' · '),
    bassDescription: describeBass(voiced.chord, bass ? prettify(bass.name) : prettify(voiced.chord.bass.name)),
    rhLabel: prettify(voiced.rhLabel),
    omission: voiced.chord.omission,
    piano: voiced.sounding.map((note) => ({ midi: note.midi, role: note.role })),
  }
}
