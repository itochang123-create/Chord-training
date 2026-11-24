import { useState } from 'react'
import { ACCOMPANIMENT_IDS, ACCOMPANIMENTS, type AccompanimentId } from '../audio/plan.ts'
import { COLOR_NOTE, PRESETS, type Preset } from '../theory/catalog.ts'
import { formatChordSymbol, QUALITY_OPTIONS, type QualityId, type RhVoicing } from '../theory/chord.ts'
import { GRAMMAR_HELP } from '../theory/parse.ts'
import { prettify, TONIC_NAMES, type Mode, type TonicName } from '../theory/pitch.ts'
import type { SavedPreset, Settings } from '../practice/storage.ts'

export function Setup({
  settings,
  namesVisible,
  activePreset,
  sounding,
  error,
  chordCount,
  chordSlots,
  presetName,
  onPresetName,
  onPatch,
  onCustom,
  onEditChord,
  onShowProgression,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
}: {
  settings: Settings
  namesVisible: boolean
  activePreset: Preset | null
  sounding: string | null
  error: string | null
  chordCount: number
  chordSlots: ChordSlot[]
  presetName: string
  onPresetName: (value: string) => void
  onPatch: (partial: Partial<Settings>) => void
  onCustom: (text: string) => void
  onEditChord: (index: number, symbol: string) => void
  onShowProgression: () => void
  onSavePreset: () => void
  onLoadPreset: (preset: SavedPreset) => void
  onDeletePreset: (id: string) => void
}) {
  const [picked, setPicked] = useState(0)
  const slot = chordSlots[Math.min(picked, Math.max(chordSlots.length - 1, 0))]

  return (
    <aside className="setup">
      <section className="setup-block">
        <h2>Key</h2>
        <label className="field-label" htmlFor="tonic">
          Tonic
        </label>
        <select
          id="tonic"
          data-testid="tonic"
          value={settings.tonicName}
          onChange={(event) => onPatch({ tonicName: event.target.value as TonicName })}
        >
          {TONIC_NAMES.map((name) => (
            <option key={name} value={name}>
              {prettify(name)}
            </option>
          ))}
        </select>
        <div className="segmented" role="group" aria-label="Mode">
          {(['major', 'minor'] as Mode[]).map((mode) => (
            <button key={mode} type="button" aria-pressed={settings.mode === mode} onClick={() => onPatch({ mode })}>
              {mode === 'major' ? 'Major' : 'Minor'}
            </button>
          ))}
        </div>
        <p className="help">
          Roman numerals follow {prettify(settings.tonicName)} {settings.mode}. In minor, III sits a minor third above the tonic, and a lowercase v stays minor. Write V when you want the major dominant.
        </p>
      </section>

      <section className="setup-block">
        <h2>Progression</h2>
        {namesVisible ? (
          <>
            <label className="field-label" htmlFor="progression">
              Common loops
            </label>
            <select
              id="progression"
              data-testid="progression"
              aria-describedby="editorial-note"
              value={activePreset?.id ?? 'custom'}
              onChange={(event) => {
                if (event.target.value === 'custom') {
                  onPatch({ presetId: 'custom' })
                  return
                }
                const preset = PRESETS.find((item) => item.id === event.target.value)
                if (!preset) return
                onPatch({ presetId: preset.id, mode: preset.mode })
              }}
            >
              {PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.nickname ? `${preset.title} · ${preset.nickname}` : preset.title}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
            <p id="editorial-note" className="help">
              Order is an editorial starting point for Mandopop familiarity, not a measured frequency chart.
            </p>
            <p className="help">{COLOR_NOTE}</p>
            {activePreset ? <p className="help">{activePreset.blurb}</p> : null}
            {sounding ? (
              <p className="ok-line" data-testid="sounding-line">
                Sounds as {sounding}
              </p>
            ) : null}
            {activePreset?.id === 'bass-walk' ? (
              <div className="row">
                <button type="button" data-testid="hear-g" onClick={() => onPatch({ presetId: 'bass-walk', mode: 'major', tonicName: 'G' })}>
                  Hear it in G
                </button>
                <button type="button" data-testid="hear-c" onClick={() => onPatch({ presetId: 'bass-walk', mode: 'major', tonicName: 'C' })}>
                  Hear it in C
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div>
            <p className="help">The progression name is hidden so the page does not give away the answer.</p>
            <button type="button" className="ghost" data-testid="show-progression" onClick={onShowProgression}>
              Reveal progression
            </button>
          </div>
        )}
      </section>

      {namesVisible ? (
        <section className="setup-block">
          <h2>Custom</h2>
          {slot ? (
            <ChordPicker
              slots={chordSlots}
              picked={Math.min(picked, chordSlots.length - 1)}
              slot={slot}
              onPick={setPicked}
              onEdit={onEditChord}
            />
          ) : null}
          <label className="field-label" htmlFor="custom-progression">
            Roman numerals, numbers, or chord symbols
          </label>
          <textarea
            id="custom-progression"
            data-testid="custom-progression"
            rows={3}
            spellCheck={false}
            placeholder="vi–IV–I–V6 or Em C G D/F#"
            value={settings.presetId === 'custom' ? settings.customText : ''}
            aria-invalid={settings.presetId === 'custom' && Boolean(error)}
            aria-describedby="parse-status"
            onChange={(event) => onCustom(event.target.value)}
          />
          <p id="parse-status" role={error && settings.presetId === 'custom' ? 'alert' : 'status'} className={error && settings.presetId === 'custom' ? 'error' : 'ok-line'}>
            {settings.presetId === 'custom'
              ? error ?? (sounding ? `Sounds as ${sounding}` : `${chordCount} chords`)
              : 'Type here to leave the preset and use your own progression.'}
          </p>
          <details className="grammar">
            <summary>Grammar and examples</summary>
            <p>
              <strong>Roman.</strong> {GRAMMAR_HELP.roman}
            </p>
            <p>
              <strong>Numbers.</strong> {GRAMMAR_HELP.numbers}
            </p>
            <p>
              <strong>Symbols.</strong> {GRAMMAR_HELP.concrete}
            </p>
            <ul>
              {GRAMMAR_HELP.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </details>
          <div className="row">
            <label className="field-label grow" htmlFor="preset-name">
              Save on this device
              <input
                id="preset-name"
                value={presetName}
                maxLength={48}
                placeholder="Name this loop"
                onChange={(event) => onPresetName(event.target.value)}
              />
            </label>
            <button type="button" onClick={onSavePreset} disabled={!presetName.trim() || Boolean(error) || chordCount === 0}>
              Save
            </button>
          </div>
          {settings.presets.length === 0 ? (
            <p className="help">No saved presets yet. They stay in this browser.</p>
          ) : (
            <ul className="preset-list">
              {settings.presets.map((preset) => (
                <li key={preset.id}>
                  <button type="button" onClick={() => onLoadPreset(preset)}>
                    {preset.name}
                  </button>
                  <button type="button" className="texty" onClick={() => onDeletePreset(preset.id)} aria-label={`Delete ${preset.name}`}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section className="setup-block">
        <h2>Piano</h2>
        <label className="field-label" htmlFor="tempo">
          Tempo · {settings.tempo} BPM
        </label>
        <div className="slider-row">
          <input
            id="tempo"
            type="range"
            min={40}
            max={200}
            value={settings.tempo}
            onChange={(event) => onPatch({ tempo: Number(event.target.value) })}
          />
          <input
            aria-label="Tempo in BPM"
            type="number"
            min={40}
            max={200}
            value={settings.tempo}
            onChange={(event) => onPatch({ tempo: Number(event.target.value) })}
          />
        </div>
        <label className="field-label" htmlFor="accompaniment">
          Accompaniment
        </label>
        <select
          id="accompaniment"
          data-testid="accompaniment"
          value={settings.accompaniment}
          onChange={(event) => onPatch({ accompaniment: event.target.value as AccompanimentId })}
        >
          {ACCOMPANIMENT_IDS.map((id) => (
            <option key={id} value={id}>
              {ACCOMPANIMENTS[id].label}
            </option>
          ))}
        </select>
        <p className="help">{ACCOMPANIMENTS[settings.accompaniment].feel} Tempo is the quarter note. The pattern chooses its own shape.</p>
        <label className="field-label" htmlFor="voicing">
          Right-hand voicing
        </label>
        <select
          id="voicing"
          data-testid="voicing"
          value={settings.rhVoicing}
          onChange={(event) => onPatch({ rhVoicing: event.target.value as RhVoicing })}
        >
          <option value="root">Root position</option>
          <option value="first">First inversion</option>
          <option value="second">Second inversion</option>
          <option value="smooth">Smooth voice leading</option>
        </select>
        <p className="help">
          The written bass and the right hand are separate. Root position puts the root at the bottom of the right hand even when the bass note is a 3rd or a non-chord slash.
        </p>
        <label className="field-label" htmlFor="volume">
          Volume · {Math.round(settings.volume * 100)}%
        </label>
        <input
          id="volume"
          data-testid="volume"
          type="range"
          min={0}
          max={100}
          value={Math.round(settings.volume * 100)}
          onChange={(event) => onPatch({ volume: Number(event.target.value) / 100 })}
        />
      </section>
    </aside>
  )
}

export type ChordSlot = {
  symbol: string
  root: string
  quality: QualityId
  bass: string
}

function ChordPicker({
  slots,
  picked,
  slot,
  onPick,
  onEdit,
}: {
  slots: ChordSlot[]
  picked: number
  slot: ChordSlot
  onPick: (index: number) => void
  onEdit: (index: number, symbol: string) => void
}) {
  const roots = TONIC_NAMES.includes(slot.root as TonicName) ? TONIC_NAMES : [slot.root, ...TONIC_NAMES]
  const bassChoices = ['', ...roots]
  return (
    <div className="chord-editor">
      <p className="field-label">Edit one chord</p>
      <div className="chord-picks" role="listbox" aria-label="Chords in this progression">
        {slots.map((item, index) => (
          <button key={`${item.symbol}-${index}`} type="button" aria-pressed={index === picked} onClick={() => onPick(index)}>
            {prettify(item.symbol)}
          </button>
        ))}
      </div>
      <div className="editor-grid">
        <label className="field-label" htmlFor="chord-root">
          Root
          <select
            id="chord-root"
            data-testid="chord-root"
            value={slot.root}
            onChange={(event) => onEdit(picked, formatChordSymbol(event.target.value, slot.quality, slot.bass || null))}
          >
            {roots.map((name) => (
              <option key={name} value={name}>
                {prettify(name)}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label" htmlFor="chord-quality">
          Quality
          <select
            id="chord-quality"
            data-testid="chord-quality"
            value={slot.quality}
            onChange={(event) => onEdit(picked, formatChordSymbol(slot.root, event.target.value as QualityId, slot.bass || null))}
          >
            {QUALITY_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label" htmlFor="chord-bass">
          Slash bass
          <select
            id="chord-bass"
            data-testid="chord-bass"
            value={slot.bass}
            onChange={(event) => onEdit(picked, formatChordSymbol(slot.root, slot.quality, event.target.value || null))}
          >
            {bassChoices.map((name) => (
              <option key={name || 'none'} value={name}>
                {name ? prettify(name) : 'None'}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
