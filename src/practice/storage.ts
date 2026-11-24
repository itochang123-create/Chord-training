import { isAccompanimentId, type AccompanimentId } from '../audio/plan.ts'
import type { RhVoicing } from '../theory/chord.ts'
import { isTonicName, TONIC_NAMES, type Mode, type TonicName } from '../theory/pitch.ts'
import type { Difficulty } from './quiz.ts'

export type Workspace = 'practice' | 'listen' | 'quiz'

export type SavedPreset = {
  id: string
  name: string
  text: string
  tonicName: TonicName
  mode: Mode
  tempo: number
  accompaniment: AccompanimentId
  rhVoicing: RhVoicing
}

export type Settings = {
  tonicName: TonicName
  mode: Mode
  presetId: string
  customText: string
  anchorTonic: TonicName | null
  anchorMode: Mode | null
  tempo: number
  accompaniment: AccompanimentId
  volume: number
  rhVoicing: RhVoicing
  loop: boolean
  workspace: Workspace
  quizDifficulty: Difficulty
  presets: SavedPreset[]
}

export const DEFAULT_SETTINGS: Settings = {
  tonicName: 'C',
  mode: 'major',
  presetId: '6415',
  customText: '',
  anchorTonic: null,
  anchorMode: null,
  tempo: 76,
  accompaniment: 'bass-chord',
  volume: 0.8,
  rhVoicing: 'smooth',
  loop: true,
  workspace: 'practice',
  quizDifficulty: 'triad',
  presets: [],
}

const STORAGE_KEY = 'chord.ito.v1'

export type KeyValueStore = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function loadSettings(store: KeyValueStore | null = browserStore()): Settings {
  if (!store) return DEFAULT_SETTINGS
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return sanitize(JSON.parse(raw) as Partial<Settings>)
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings, store: KeyValueStore | null = browserStore()): void {
  if (!store) return
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Safari private mode can refuse storage. The session still plays.
  }
}

function browserStore(): KeyValueStore | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

function sanitize(value: Partial<Settings>): Settings {
  const hands: RhVoicing[] = ['root', 'first', 'second', 'smooth']
  const tonicName = typeof value.tonicName === 'string' && isTonicName(value.tonicName) ? value.tonicName : 'C'
  const rawDifficulty = value.quizDifficulty as string | undefined
  const difficulty = rawDifficulty === 'color' || rawDifficulty === 'rich' ? 'color' : 'triad'
  return {
    tonicName,
    mode: value.mode === 'minor' ? 'minor' : 'major',
    presetId: typeof value.presetId === 'string' && value.presetId ? value.presetId : '6415',
    customText: typeof value.customText === 'string' ? value.customText.slice(0, 500) : '',
    anchorTonic: typeof value.anchorTonic === 'string' && isTonicName(value.anchorTonic) ? value.anchorTonic : null,
    anchorMode: value.anchorMode === 'major' || value.anchorMode === 'minor' ? value.anchorMode : null,
    tempo: clamp(value.tempo, 40, 200, 76),
    accompaniment: typeof value.accompaniment === 'string' && isAccompanimentId(value.accompaniment) ? value.accompaniment : 'bass-chord',
    volume: clamp(value.volume, 0, 1, 0.8),
    rhVoicing: hands.includes(value.rhVoicing as RhVoicing) ? (value.rhVoicing as RhVoicing) : 'smooth',
    loop: value.loop !== false,
    workspace: value.workspace === 'listen' || value.workspace === 'quiz' ? value.workspace : 'practice',
    quizDifficulty: difficulty,
    presets: Array.isArray(value.presets) ? value.presets.map(sanitizePreset).filter((preset) => preset.name && preset.text).slice(0, 40) : [],
  }
}

function sanitizePreset(value: Partial<SavedPreset>): SavedPreset {
  const hands: RhVoicing[] = ['root', 'first', 'second', 'smooth']
  return {
    id: typeof value.id === 'string' ? value.id : `saved-${TONIC_NAMES.length}`,
    name: typeof value.name === 'string' ? value.name.slice(0, 48) : '',
    text: typeof value.text === 'string' ? value.text.slice(0, 500) : '',
    tonicName: typeof value.tonicName === 'string' && isTonicName(value.tonicName) ? value.tonicName : 'C',
    mode: value.mode === 'minor' ? 'minor' : 'major',
    tempo: clamp(value.tempo, 40, 200, 76),
    accompaniment: typeof value.accompaniment === 'string' && isAccompanimentId(value.accompaniment) ? value.accompaniment : 'bass-chord',
    rhVoicing: hands.includes(value.rhVoicing as RhVoicing) ? (value.rhVoicing as RhVoicing) : 'smooth',
  }
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}
