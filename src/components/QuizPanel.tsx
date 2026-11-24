import type { Difficulty, Grade, QuizPublic } from '../practice/quiz.ts'

export function QuizPanel({
  question,
  feedback,
  pickedId,
  correctChoiceId,
  score,
  playing,
  onDifficulty,
  onPlay,
  onReplay,
  onAnswer,
  onNext,
}: {
  question: QuizPublic
  feedback: Grade | null
  pickedId: string | null
  correctChoiceId: string | null
  score: { correct: number; answered: number; streak: number }
  playing: boolean
  onDifficulty: (difficulty: Difficulty) => void
  onPlay: () => void
  onReplay: () => void
  onAnswer: (id: string) => void
  onNext: () => void
}) {
  return (
    <section className="quiz" data-testid="quiz" aria-labelledby="quiz-title">
      <div className="stage-top">
        <p className="eyebrow">Recognition</p>
        <p className="score" data-testid="score">
          {score.correct}/{score.answered || 0} · streak {score.streak}
        </p>
      </div>
      <h2 id="quiz-title">{question.prompt}</h2>
      <div className="segmented" role="group" aria-label="Difficulty">
        <button type="button" aria-pressed={question.difficulty === 'triad'} onClick={() => onDifficulty('triad')}>
          Triads
        </button>
        <button type="button" aria-pressed={question.difficulty === 'color'} onClick={() => onDifficulty('color')}>
          Color chords
        </button>
      </div>
      <p className="help">
        {question.difficulty === 'triad'
          ? 'Triads only, in a random key. The choices are the progressions, not the answer.'
          : 'These loops use color on some chords only. A 13th or a sus chord is not copied onto the others. The key stays hidden until you answer.'}
      </p>
      <div className="transport-buttons">
        <button type="button" className="play" data-testid="quiz-play" onClick={onPlay} disabled={playing}>
          {playing ? 'Playing' : 'Play'}
        </button>
        <button type="button" data-testid="quiz-replay" onClick={onReplay}>
          Replay
        </button>
      </div>
      <div className="choices" role="group" aria-label="Possible progressions">
        {question.choices.map((choice) => {
          const revealed = correctChoiceId !== null
          const isCorrect = revealed && choice.id === correctChoiceId
          const isWrongPick = revealed && choice.id === pickedId && !isCorrect
          return (
            <button
              key={choice.id}
              type="button"
              className={isCorrect ? 'choice correct' : isWrongPick ? 'choice wrong' : 'choice'}
              onClick={() => onAnswer(choice.id)}
              disabled={revealed}
              data-testid="quiz-choice"
            >
              {choice.label}
            </button>
          )
        })}
      </div>
      {feedback ? (
        <div className="feedback" data-testid="quiz-feedback" role="status">
          <p>{feedback.correct ? 'Yes.' : 'Not that one.'}</p>
          <p>
            {feedback.answerLabel} in {feedback.keyLabel}. Sounded as {feedback.sounding}.
          </p>
          <button type="button" className="play" onClick={onNext}>
            Next progression
          </button>
        </div>
      ) : (
        <p className="help">Answer after you have heard it. Nothing on this screen marks the right choice before then.</p>
      )}
    </section>
  )
}
