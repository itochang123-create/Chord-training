import type { VisualFrame } from '../audio/engine.ts'

export function Transport({
  frame,
  canPlay,
  loop,
  onPlay,
  onPause,
  onStop,
  onRestart,
  onLoop,
}: {
  frame: VisualFrame
  canPlay: boolean
  loop: boolean
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onRestart: () => void
  onLoop: () => void
}) {
  const hint = frame.interrupted
    ? 'Sound paused after an interruption. Press Play to resume.'
    : frame.audioReady
      ? frame.status === 'playing'
        ? 'Sound is on. The highlighted keys are the notes scheduled on the audio clock.'
        : 'Sound is ready.'
      : 'Press Play to start sound. Safari stays quiet until you do.'

  return (
    <div className="transport">
      <div className="transport-buttons">
        <button type="button" className="play" data-testid="play" onClick={onPlay} disabled={!canPlay || frame.status === 'playing'}>
          Play
        </button>
        <button type="button" data-testid="pause" onClick={onPause} disabled={frame.status !== 'playing'}>
          Pause
        </button>
        <button type="button" data-testid="stop" onClick={onStop} disabled={frame.status === 'stopped'}>
          Stop
        </button>
        <button type="button" data-testid="restart" onClick={onRestart} disabled={!canPlay}>
          Restart
        </button>
        <button type="button" data-testid="loop" aria-pressed={loop} onClick={onLoop}>
          {loop ? 'Loop on' : 'Loop off'}
        </button>
      </div>
      <p className="hint" role="status">
        {hint}
      </p>
    </div>
  )
}
