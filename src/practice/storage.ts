import { isAccompanimentId, type AccompanimentId } from '../audio/plan.ts'
import { EMPTY_COLORS, type ColorFlags, type ColorId } from '../theory/colorize.ts'
import type { Mode } from '../theory/pitch.ts'
import type { Difficulty } from './quiz.ts'

export const PRACTICE_TONIC = 'C' as const
export const PRACTICE_VOLUME = 0.8

export type Workspace = 'practice' | 'listen' | 'quiz'

export type SavedPreset = {
  id: string
  name: string
  text: string
  mode: Mode
  tempo: number
  accompaniment: AccompanimentId
}

export type Settings = {
  mode: Mode
  presetId: string
  customText: string
  tempo: number
  accompaniment: AccompanimentId
  colors: ColorFlags
  loop: boolean
  workspace: Workspace
  quizDifficulty: Difficulty
  presets: SavedPreset[]
}

export const DEFAULT_SETTINGS: Settings = {
  mode: 'major',
  presetId: '1645',
  customText: '',
  tempo: 76,
  accompaniment: 'bass-chord',
  colors: { ...EMPTY_COLORS },
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
  const rawDifficulty = value.quizDifficulty as string | undefined
  const difficulty = rawDifficulty === 'color' || rawDifficulty === 'rich' ? 'color' : 'triad'
  return {
    mode: value.mode === 'minor' ? 'minor' : 'major',
    presetId: typeof value.presetId === 'string' && value.presetId ? value.presetId : '1645',
    customText: typeof value.customText === 'string' ? value.customText.slice(0, 500) : '',
    tempo: clamp(value.tempo, 40, 200, 76),
    accompaniment: typeof value.accompaniment === 'string' && isAccompanimentId(value.accompaniment) ? value.accompaniment : 'bass-chord',
    colors: sanitizeColors(value.colors),
    loop: value.loop !== false,
    workspace: value.workspace === 'listen' || value.workspace === 'quiz' ? value.workspace : 'practice',
    quizDifficulty: difficulty,
    presets: Array.isArray(value.presets) ? value.presets.map(sanitizePreset).filter((preset) => preset.name && preset.text).slice(0, 40) : [],
  }
}

function sanitizeColors(value: Partial<ColorFlags> | undefined): ColorFlags {
  const source = value ?? {}
  const colors = { ...EMPTY_COLORS }
  for (const id of Object.keys(colors) as ColorId[]) colors[id] = source[id] === true
  return colors
}

function sanitizePreset(value: Partial<SavedPreset>): SavedPreset {
  return {
    id: typeof value.id === 'string' ? value.id : 'saved',
    name: typeof value.name === 'string' ? value.name.slice(0, 48) : '',
    text: typeof value.text === 'string' ? value.text.slice(0, 500) : '',
    mode: value.mode === 'minor' ? 'minor' : 'major',
    tempo: clamp(value.tempo, 40, 200, 76),
    accompaniment: typeof value.accompaniment === 'string' && isAccompanimentId(value.accompaniment) ? value.accompaniment : 'bass-chord',
  }
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}
