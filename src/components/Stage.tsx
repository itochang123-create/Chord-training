import type { StageModel } from '../practice/stageModel.ts'

export function Stage({
  model,
  soundingNow,
  patternFeel,
  onReveal,
}: {
  model: StageModel
  soundingNow: string
  patternFeel: string
  onReveal: () => void
}) {
  const live =
    model.kind === 'shown'
      ? `${model.chord.symbol}. ${model.chord.roman}. Bass ${model.chord.bass}. Right hand ${model.chord.rightHand}.`
      : model.kind === 'hidden'
        ? model.positionLabel
        : model.message

  return (
    <section className="stage" aria-labelledby="stage-title">
      <div className="stage-top">
        <p className="eyebrow">{model.positionLabel}</p>
        {model.kind === 'hidden' ? (
          <button type="button" className="ghost" data-testid="reveal" onClick={onReveal}>
            Reveal chord
          </button>
        ) : null}
      </div>
      {model.kind === 'hidden' ? (
        <div className="listen-cover" data-testid="listen-cover">
          <h2 id="stage-title">Listen</h2>
          <p>Names and the keyboard stay covered. When you have a guess, reveal this chord.</p>
        </div>
      ) : model.kind === 'empty' ? (
        <div className="listen-cover">
          <h2 id="stage-title">Nothing to play</h2>
          <p>{model.message}</p>
        </div>
      ) : (
        <>
          <h2 id="stage-title" className="symbol" data-testid="current-symbol">
            {model.chord.symbol}
          </h2>
          <p className="roman" data-testid="roman">
            {model.chord.roman}
          </p>
          <div className="facts">
            <div className="fact">
              <span>Voicing</span>
              <strong data-testid="sounding">
                Bass {model.chord.bass} · right hand {model.chord.rightHand}
              </strong>
            </div>
            <div className="fact">
              <span>Bass</span>
              <strong data-testid="bass-line">{model.chord.bass}</strong>
            </div>
            <div className="fact">
              <span>Right hand</span>
              <strong data-testid="rh-line">{model.chord.rightHand}</strong>
            </div>
            <div className="fact">
              <span>Sounding now</span>
              <strong data-testid="sounding-now">{soundingNow}</strong>
            </div>
          </div>
          <p className="inversion" data-testid="inversion-line">
            Bass: {model.chord.bassDescription}. Right hand: {model.chord.rhLabel}.
          </p>
          {model.chord.omission ? <p className="omission">{model.chord.omission}</p> : null}
        </>
      )}
      <p className="beat-readout">{patternFeel}</p>
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </section>
  )
}
