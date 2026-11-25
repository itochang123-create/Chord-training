import type { VisualFrame } from '../audio/engine.ts'
import { SOUND_CHECK } from '../audio/ios.ts'

export function Transport({
  frame,
  canPlay,
  loop,
  onPlay,
  onPrime,
  onPause,
  onStop,
  onRestart,
  onLoop,
}: {
  frame: VisualFrame
  canPlay: boolean
  loop: boolean
  onPlay: () => void
  onPrime: () => void
  onPause: () => void
  onStop: () => void
  onRestart: () => void
  onLoop: () => void
}) {
  const hint = frame.soundCheck
    ? SOUND_CHECK
    : frame.interrupted
      ? 'Sound paused after an interruption. Press Play to resume.'
      : frame.audioReady
        ? frame.status === 'playing'
          ? 'Sound is on. The highlighted keys are the notes scheduled on the audio clock.'
          : 'Sound is ready.'
        : 'Press Play to start sound. Safari stays quiet until you do.'

  return (
    <div className="transport">
      <div className="transport-buttons">
        <button
          type="button"
          className="play"
          data-testid="play"
          onPointerDown={onPrime}
          onTouchEnd={onPrime}
          onClick={onPlay}
          disabled={!canPlay || frame.status === 'playing'}
        >
          Play
        </button>
        <button type="button" data-testid="pause" onClick={onPause} disabled={frame.status !== 'playing'}>
          Pause
        </button>
        <button type="button" data-testid="stop" onClick={onStop} disabled={frame.status === 'stopped'}>
          Stop
        </button>
        <button type="button" data-testid="restart" onPointerDown={onPrime} onTouchEnd={onPrime} onClick={onRestart} disabled={!canPlay}>
          Restart
        </button>
        <button type="button" data-testid="loop" aria-pressed={loop} onClick={onLoop}>
          {loop ? 'Loop on' : 'Loop off'}
        </button>
      </div>
      <p className={frame.soundCheck ? 'hint sound-check' : 'hint'} role="status" data-testid={frame.soundCheck ? 'sound-check' : undefined}>
        {hint}
      </p>
    </div>
  )
}
