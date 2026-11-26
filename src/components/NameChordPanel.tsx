import { NAME_ANSWERS, type NameAnswer, type NameTrial } from '../practice/nameChord.ts'

export function NameChordPanel({
  trial,
  picked,
  correct,
  score,
  arpeggio,
  onArpeggio,
  onAnswer,
  onNext,
  onReplay,
  onPrime,
}: {
  trial: NameTrial
  picked: NameAnswer | null
  correct: boolean | null
  score: { correct: number; answered: number }
  arpeggio: boolean
  onArpeggio: (value: boolean) => void
  onAnswer: (answer: NameAnswer) => void
  onNext: () => void
  onReplay: () => void
  onPrime: () => void
}) {
  return (
    <section className="quiz name-chord" data-testid="name-chord" aria-labelledby="name-title">
      <div className="stage-top">
        <p className="eyebrow">Name the chord</p>
        <p className="score" data-testid="name-score">
          {score.correct}/{score.answered}
        </p>
      </div>
      <h2 id="name-title">{picked ? trial.label : 'What quality is this?'}</h2>
      {picked ? (
        <p className={correct ? 'ok-line' : 'error'} data-testid="name-feedback" role="status">
          {correct ? 'Correct' : 'Not quite'}
        </p>
      ) : (
        <p className="help">Listen, then tap the quality. The name stays hidden until you answer.</p>
      )}
      <div className="name-answers" role="group" aria-label="Chord quality">
        {NAME_ANSWERS.map((answer) => {
          const selected = picked === answer.id
          const isAnswer = picked !== null && answer.id === trial.answer
          const className = isAnswer ? 'choice correct' : selected ? 'choice wrong' : 'choice'
          return (
            <button
              key={answer.id}
              type="button"
              className={className}
              data-testid={`name-${answer.id}`}
              onClick={() => onAnswer(answer.id)}
              disabled={picked !== null}
            >
              {answer.label}
            </button>
          )
        })}
      </div>
      <div className="transport-buttons name-actions">
        <button type="button" data-testid="name-replay" onPointerDown={onPrime} onTouchEnd={onPrime} onClick={onReplay}>
          Replay
        </button>
        <button type="button" aria-pressed={arpeggio} data-testid="name-arpeggio" onClick={() => onArpeggio(!arpeggio)}>
          {arpeggio ? 'Hearing an arpeggio' : 'Hear as arpeggio'}
        </button>
        <button type="button" data-testid="name-next" onClick={onNext} disabled={picked === null}>
          Next
        </button>
      </div>
    </section>
  )
}
