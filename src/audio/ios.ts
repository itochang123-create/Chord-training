/** 0.1s of 8-bit silence. Looping it moves iOS onto the media channel, which ignores the ring/silent switch. */
export const SILENT_LOOP_WAV =
  'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA=='

/** Shown when a tap did not leave the audio context running. */
export const SOUND_CHECK = 'Tap Play again — and check the silent switch / volume'

/** Notes are scheduled this far after the post-resume audio clock. */
export const SCHEDULE_LEAD = 0.08

type AudioCtor = new () => AudioContext

type AudioSession = { type: string }

export function enablePlaybackSession(nav: object | null | undefined): void {
  const session = (nav as { audioSession?: AudioSession } | null | undefined)?.audioSession
  if (!session) return
  try {
    session.type = 'playback'
  } catch {
    // A read-only session object is ignored; the silent media element is the other path.
  }
}

export function audioContextConstructor(win: { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor }): AudioCtor | null {
  return win.AudioContext ?? win.webkitAudioContext ?? null
}

export function contextIsRunning(state: string): boolean {
  return state === 'running'
}

export function silentWavHeader(): string {
  const encoded = SILENT_LOOP_WAV.slice(SILENT_LOOP_WAV.indexOf(',') + 1)
  const bytes = globalThis.atob(encoded)
  return bytes.slice(0, 4)
}
