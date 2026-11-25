import { describe, expect, test } from 'vitest'
import {
  SOUND_CHECK,
  SCHEDULE_LEAD,
  SILENT_LOOP_WAV,
  audioContextConstructor,
  contextIsRunning,
  enablePlaybackSession,
  silentWavHeader,
} from './ios.ts'

describe('iOS audio unlock', () => {
  test('playback session is requested when the browser exposes one', () => {
    const session = { type: 'auto' }
    enablePlaybackSession({ audioSession: session })
    expect(session.type).toBe('playback')
    enablePlaybackSession(undefined)
    enablePlaybackSession({ audioSession: undefined })
  })

  test('webkitAudioContext is the fallback when AudioContext is missing', () => {
    class WebkitCtx {}
    expect(audioContextConstructor({ webkitAudioContext: WebkitCtx as unknown as typeof AudioContext })).toBe(WebkitCtx)
    class Standard {}
    expect(
      audioContextConstructor({
        AudioContext: Standard as unknown as typeof AudioContext,
        webkitAudioContext: WebkitCtx as unknown as typeof AudioContext,
      }),
    ).toBe(Standard)
    expect(audioContextConstructor({})).toBeNull()
  })

  test('only a running context counts as unlocked', () => {
    expect(contextIsRunning('running')).toBe(true)
    expect(contextIsRunning('suspended')).toBe(false)
    expect(contextIsRunning('interrupted')).toBe(false)
  })

  test('the silent loop is a wav, and scheduling waits past the current clock', () => {
    expect(SILENT_LOOP_WAV.startsWith('data:audio/wav;base64,')).toBe(true)
    expect(silentWavHeader()).toBe('RIFF')
    expect(SCHEDULE_LEAD).toBeGreaterThan(0.05)
    expect(SOUND_CHECK).toMatch(/silent switch/)
  })
})
