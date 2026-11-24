import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { performanceSignature, PlaybackEngine, type PerformanceConfig } from './audio/engine.ts'
import { ACCOMPANIMENTS } from './audio/plan.ts'
import { Piano } from './components/Piano.tsx'
import { QuizPanel } from './components/QuizPanel.tsx'
import { Setup } from './components/Setup.tsx'
import { Stage } from './components/Stage.tsx'
import { Transport } from './components/Transport.tsx'
import { EDITORIAL_NOTE, presetById, PRESETS } from './theory/catalog.ts'
import { voicePractice, VOICING_OMISSION_SUMMARY } from './theory/chord.ts'
import { applyColors } from './theory/colorize.ts'
import { makeKey, prettify } from './theory/pitch.ts'
import { resolveProgression } from './theory/resolve.ts'
import { grade, makeQuestion, type Grade, type QuizPublic, type QuizSecret } from './practice/quiz.ts'
import { stageModel } from './practice/stageModel.ts'
import { PRACTICE_VOLUME, saveSettings, type SavedPreset, type Settings, loadSettings } from './practice/storage.ts'

type QuizView = {
  key: string
  publicQuestion: QuizPublic
  feedback: Grade | null
  pickedId: string | null
  correctChoiceId: string | null
  secret: QuizSecret
  score: { correct: number; answered: number; streak: number }
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [presetName, setPresetName] = useState('')
  const [cover, setCover] = useState({ workspace: settings.workspace, chord: null as number | null, progression: false })
  const [quizSession, setQuizSession] = useState(0)
  const [quizRound, setQuizRound] = useState(0)
  const [quiz, setQuiz] = useState<QuizView | null>(null)
  const quizKey = settings.workspace === 'quiz' ? `${quizSession}:${settings.quizDifficulty}:${quizRound}` : null
  if (quizKey && quiz?.key !== quizKey) {
    const made = makeQuestion(settings.quizDifficulty, Math.random)
    const sameSitting = quiz ? sittingOf(quiz.key) === sittingOf(quizKey) : false
    setQuiz({
      key: quizKey,
      publicQuestion: made.publicQuestion,
      feedback: null,
      pickedId: null,
      correctChoiceId: null,
      secret: made.secret,
      score: sameSitting && quiz ? quiz.score : { correct: 0, answered: 0, streak: 0 },
    })
  }
  const engine = useMemo(() => new PlaybackEngine(), [])
  const quizSound = useRef<QuizSecret | null>(null)
  const frame = useSyncExternalStore(engine.subscribe, engine.getFrame, engine.getFrame)

  const activePreset = settings.presetId === 'custom' ? null : (presetById(settings.presetId) ?? PRESETS[0])
  const text = activePreset ? activePreset.formula : settings.customText
  const soundingKey = useMemo(() => makeKey('C', settings.mode), [settings.mode])
  const resolved = useMemo(() => resolveProgression(text, soundingKey, null), [text, soundingKey])
  const colored = useMemo(
    () => (resolved.ok ? applyColors(resolved.chords, soundingKey, settings.colors) : []),
    [resolved, soundingKey, settings.colors],
  )
  const voiced = useMemo(() => voicePractice(colored), [colored])
  const practiceConfig = useMemo(() => toPerformance(settings, voiced), [settings, voiced])

  useEffect(() => () => engine.dispose(), [engine])
  useEffect(() => {
    saveSettings(settings)
  }, [settings])
  useEffect(() => {
    if (settings.workspace === 'quiz') return
    engine.setPerformance(practiceConfig)
  }, [engine, practiceConfig, settings.workspace])
  useEffect(() => {
    if (!resolved.ok) engine.stop()
  }, [engine, resolved])
  useEffect(() => {
    if (settings.workspace !== 'quiz' || !quiz) return
    if (quizSound.current !== quiz.secret) {
      quizSound.current = quiz.secret
      engine.stop()
    }
    engine.setPerformance(quizPerformance(quiz.secret))
  }, [engine, quiz, settings.workspace])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && target.closest('input, textarea, select, button, a')) return
      if (event.code === 'Space') {
        event.preventDefault()
        if (settings.workspace === 'quiz') return
        void engine.toggle()
      } else if (event.key === 'Escape') {
        engine.stop()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [engine, settings.workspace])

  const coverMatches = cover.workspace === settings.workspace
  const namesVisible = settings.workspace === 'practice' || (coverMatches && cover.progression)
  const chordIndex = frame.status === 'stopped' ? 0 : frame.chordIndex
  const model = stageModel({
    workspace: settings.workspace === 'listen' ? 'listen' : 'practice',
    revealed: settings.workspace !== 'listen' || (coverMatches && cover.chord === chordIndex),
    chordIndex,
    chordCount: voiced.length,
    voiced: voiced[chordIndex] ?? null,
  })
  const soundingLabel = colored.length ? colored.map((chord) => prettify(chord.symbol)).join(' – ') : null
  const currentVoicing = voiced[chordIndex]
  const soundingNow =
    frame.active.length === 0 || !currentVoicing
      ? '—'
      : frame.active
          .map((note) => currentVoicing.sounding.find((item) => item.midi === note.midi && item.role === note.role)?.name)
          .filter((name): name is string => Boolean(name))
          .map((name) => prettify(name))
          .join(' · ') || '—'
  const pianoNotes = model.kind === 'shown' ? frame.active : []

  function patch(partial: Partial<Settings>) {
    setSettings((current) => ({ ...current, ...partial }))
  }

  function onCustom(value: string) {
    setSettings((current) => ({
      ...current,
      customText: value,
      presetId: 'custom',
      mode: 'major',
    }))
  }

  function savePreset() {
    const name = presetName.trim()
    if (!name || !resolved.ok) return
    const saved: SavedPreset = {
      id: `user-${Date.now()}`,
      name,
      text,
      mode: settings.mode,
      tempo: settings.tempo,
      accompaniment: settings.accompaniment,
    }
    setSettings((current) => ({ ...current, presets: [saved, ...current.presets].slice(0, 40) }))
    setPresetName('')
  }

  function loadPreset(preset: SavedPreset) {
    setSettings((current) => ({
      ...current,
      presetId: 'custom',
      customText: preset.text,
      mode: preset.mode,
      tempo: preset.tempo,
      accompaniment: preset.accompaniment,
    }))
  }

  function answer(id: string) {
    setQuiz((current) => {
      if (!current || current.feedback) return current
      const result = grade(current.secret, id)
      return {
        ...current,
        feedback: result,
        pickedId: id,
        correctChoiceId: current.secret.correctChoiceId,
        score: {
          answered: current.score.answered + 1,
          correct: current.score.correct + (result.correct ? 1 : 0),
          streak: result.correct ? current.score.streak + 1 : 0,
        },
      }
    })
  }

  function nextQuestion() {
    setQuizRound((round) => round + 1)
  }

  async function playQuiz() {
    if (!quiz) return
    engine.setPerformance(quizPerformance(quiz.secret))
    await engine.play()
  }

  async function replayQuiz() {
    if (!quiz) return
    engine.setPerformance(quizPerformance(quiz.secret))
    await engine.restart()
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <p className="brand-kicker">For Ito</p>
          <h1>Chord</h1>
          <p className="tagline">Hear a progression until the changes sit in your ear.</p>
        </div>
        <div className="tabs" role="tablist" aria-label="Workspace">
          {(['practice', 'listen', 'quiz'] as const).map((workspace) => (
            <button
              key={workspace}
              type="button"
              role="tab"
              aria-selected={settings.workspace === workspace}
              data-testid={`workspace-${workspace}`}
              onClick={() => {
                if (workspace === 'quiz' && settings.workspace !== 'quiz') {
                  setQuizSession((session) => session + 1)
                  setQuizRound(0)
                }
                patch({ workspace })
              }}
            >
              {workspace === 'practice' ? 'Practice' : workspace === 'listen' ? 'Listen' : 'Quiz'}
            </button>
          ))}
        </div>
      </header>

      {settings.workspace === 'quiz' ? (
        quiz ? (
          <QuizPanel
            question={quiz.publicQuestion}
            feedback={quiz.feedback}
            pickedId={quiz.pickedId}
            correctChoiceId={quiz.correctChoiceId}
            score={quiz.score}
            playing={frame.status === 'playing'}
            onDifficulty={(quizDifficulty) => patch({ quizDifficulty })}
            onPlay={() => void playQuiz()}
            onReplay={() => void replayQuiz()}
            onAnswer={answer}
            onNext={nextQuestion}
          />
        ) : (
          <p className="hint">Preparing a question.</p>
        )
      ) : (
        <div className="workspace">
          <div className="stage-column">
            {namesVisible && resolved.ok ? (
              <ol className="strip" data-testid="progression-strip">
                {voiced.map((chord, index) => (
                  <li key={`${chord.chord.symbol}-${index}`} aria-current={index === chordIndex ? 'true' : undefined}>
                    <span>{prettify(chord.chord.symbol)}</span>
                    <small>{prettify(chord.chord.roman)}</small>
                  </li>
                ))}
              </ol>
            ) : null}
            <Stage
              model={model}
              soundingNow={model.kind === 'shown' ? soundingNow : '—'}
              patternFeel={ACCOMPANIMENTS[settings.accompaniment].feel}
              onReveal={() =>
                setCover({
                  workspace: settings.workspace,
                  chord: chordIndex,
                  progression: coverMatches && cover.progression,
                })
              }
            />
            {model.kind === 'shown' ? (
              <Piano
                notes={pianoNotes}
                scrollKey={`${chordIndex}:${soundingLabel ?? ''}`}
                caption={
                  frame.status === 'playing'
                    ? 'Amber keys are the bass. Teal keys are the right hand. Lit keys are the notes sounding right now.'
                    : 'Amber keys are the bass. Teal keys are the right hand. Nothing lights until a note is actually sounding.'
                }
              />
            ) : (
              <div className="piano-cover" data-testid="piano-cover">
                {model.kind === 'hidden' ? 'Keyboard covered until you reveal.' : 'The keyboard shows up when the progression is valid.'}
              </div>
            )}
            <Transport
              frame={frame}
              canPlay={resolved.ok && voiced.length > 0}
              loop={settings.loop}
              onPlay={() => void engine.play()}
              onPause={() => engine.pause()}
              onStop={() => engine.stop()}
              onRestart={() => void engine.restart()}
              onLoop={() => patch({ loop: !settings.loop })}
            />
          </div>
          <Setup
            settings={settings}
            namesVisible={namesVisible}
            activePreset={activePreset}
            sounding={namesVisible ? soundingLabel : null}
            error={resolved.ok ? null : resolved.error}
            chordCount={voiced.length}
            presetName={presetName}
            onPresetName={setPresetName}
            onPatch={patch}
            onCustom={onCustom}
            onShowProgression={() =>
              setCover({
                workspace: settings.workspace,
                chord: coverMatches ? cover.chord : null,
                progression: true,
              })
            }
            onSavePreset={savePreset}
            onLoadPreset={loadPreset}
            onDeletePreset={(id) =>
              setSettings((current) => ({ ...current, presets: current.presets.filter((preset) => preset.id !== id) }))
            }
          />
        </div>
      )}

      <footer>
        <p>{EDITORIAL_NOTE}</p>
        <p>{VOICING_OMISSION_SUMMARY}</p>
        <p>The sound is synthesized here. Nothing is uploaded, and saved loops stay in this browser.</p>
      </footer>
    </div>
  )
}

function sittingOf(key: string): string {
  const [session, difficulty] = key.split(':')
  return `${session}:${difficulty}`
}

function toPerformance(settings: Settings, voiced: ReturnType<typeof voicePractice>): PerformanceConfig {
  const partial = {
    bpm: settings.tempo,
    accompaniment: settings.accompaniment,
    loop: settings.loop,
    volume: PRACTICE_VOLUME,
    voiced,
  }
  return { ...partial, signature: performanceSignature(partial) }
}

function quizPerformance(secret: QuizSecret): PerformanceConfig {
  const partial = {
    bpm: 84,
    accompaniment: 'audition' as const,
    loop: true,
    volume: PRACTICE_VOLUME,
    voiced: voicePractice(secret.chords),
  }
  return { ...partial, signature: performanceSignature(partial) }
}
