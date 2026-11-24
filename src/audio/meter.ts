export type TimeSignatureId = '2/4' | '3/4' | '4/4' | '5/4' | '6/8'

export type Meter = {
  id: TimeSignatureId
  beatsPerBar: number
  beatUnit: 'quarter' | 'dotted quarter'
  subdivisionsPerBeat: number
  summary: string
}

export const METERS: Record<TimeSignatureId, Meter> = {
  '2/4': {
    id: '2/4',
    beatsPerBar: 2,
    beatUnit: 'quarter',
    subdivisionsPerBeat: 2,
    summary: 'BPM is the quarter note. Two beats per bar. An eighth note is half a beat.',
  },
  '3/4': {
    id: '3/4',
    beatsPerBar: 3,
    beatUnit: 'quarter',
    subdivisionsPerBeat: 2,
    summary: 'BPM is the quarter note. Three beats per bar. An eighth note is half a beat.',
  },
  '4/4': {
    id: '4/4',
    beatsPerBar: 4,
    beatUnit: 'quarter',
    subdivisionsPerBeat: 2,
    summary: 'BPM is the quarter note. Four beats per bar. An eighth note is half a beat.',
  },
  '5/4': {
    id: '5/4',
    beatsPerBar: 5,
    beatUnit: 'quarter',
    subdivisionsPerBeat: 2,
    summary: 'BPM is the quarter note. Five beats per bar. An eighth note is half a beat.',
  },
  '6/8': {
    id: '6/8',
    beatsPerBar: 2,
    beatUnit: 'dotted quarter',
    subdivisionsPerBeat: 3,
    summary:
      'BPM is the dotted quarter, and there are two of those beats in a bar. Each beat divides into three eighth notes.',
  },
}

export const METER_IDS: TimeSignatureId[] = ['4/4', '3/4', '6/8', '2/4', '5/4']

export function secondsPerBeat(bpm: number): number {
  return 60 / bpm
}

export function chordSeconds(bpm: number, beatsPerChord: number): number {
  return beatsPerChord * secondsPerBeat(bpm)
}

export function chordLengthLabel(beatsPerChord: number, meter: Meter): string {
  const beatWord = beatsPerChord === 1 ? 'beat' : 'beats'
  const whole = Math.floor(beatsPerChord / meter.beatsPerBar)
  const remainder = beatsPerChord % meter.beatsPerBar
  if (remainder === 0) {
    const barWord = whole === 1 ? 'bar' : 'bars'
    return `${beatsPerChord} ${beatWord} · ${whole} ${barWord} of ${meter.id}`
  }
  if (whole === 0) return `${beatsPerChord} ${beatWord} · shorter than one bar of ${meter.id}`
  const barWord = whole === 1 ? 'bar' : 'bars'
  const remWord = remainder === 1 ? 'beat' : 'beats'
  return `${beatsPerChord} ${beatWord} · ${whole} ${barWord} and ${remainder} ${remWord} of ${meter.id}`
}

/** Keep the musical beat when tempo changes. BPM scales time; it does not change how many beats a chord lasts. */
export function remapOrigin(args: {
  now: number
  oldOriginAudio: number
  oldOriginBeat: number
  oldBpm: number
}): { originAudio: number; originBeat: number } {
  const beat = args.oldOriginBeat + (args.now - args.oldOriginAudio) / secondsPerBeat(args.oldBpm)
  return { originAudio: args.now, originBeat: beat }
}
