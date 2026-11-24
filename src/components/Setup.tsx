import { ACCOMPANIMENT_IDS, ACCOMPANIMENTS, type AccompanimentId } from '../audio/plan.ts'
import type { SavedPreset, Settings } from '../practice/storage.ts'
import { COLOR_NOTE, PRESETS, type Preset } from '../theory/catalog.ts'
import { COLOR_BUTTONS, COLOR_RULE, type ColorId } from '../theory/colorize.ts'
import { GRAMMAR_HELP } from '../theory/parse.ts'

export function Setup({
  settings,
  namesVisible,
  activePreset,
  sounding,
  error,
  chordCount,
  presetName,
  onPresetName,
  onPatch,
  onCustom,
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
  presetName: string
  onPresetName: (value: string) => void
  onPatch: (partial: Partial<Settings>) => void
  onCustom: (text: string) => void
  onShowProgression: () => void
  onSavePreset: () => void
  onLoadPreset: (preset: SavedPreset) => void
  onDeletePreset: (id: string) => void
}) {
  return (
    <aside className="setup">
      <section className="setup-block">
        <h2>Progression</h2>
        <p className="help">Practice is in C. 1645 is C–Am–F–G.</p>
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
                  onPatch({ presetId: 'custom', mode: 'major' })
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

      <section className="setup-block">
        <h2>Piano</h2>
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
      </section>

      <section className="setup-block">
        <h2>Color</h2>
        <div className="color-buttons" role="group" aria-label="Add a color once">
          {COLOR_BUTTONS.map((button) => (
            <button
              key={button.id}
              type="button"
              data-testid={`color-${button.label}`}
              aria-pressed={settings.colors[button.id]}
              onClick={() => toggleColor(button.id)}
            >
              {button.label}
            </button>
          ))}
        </div>
        <p className="help" data-testid="color-rule">
          {COLOR_RULE}
        </p>
      </section>

      {namesVisible ? (
        <section className="setup-block">
          <h2>Custom</h2>
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
    </aside>
  )

  function toggleColor(id: ColorId) {
    onPatch({ colors: { ...settings.colors, [id]: !settings.colors[id] } })
  }
}