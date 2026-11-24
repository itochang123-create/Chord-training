import { useEffect, useRef } from 'react'

type LitNote = { midi: number; role: 'bass' | 'rh' }

const LOW = 36
const HIGH = 84

export function Piano({
  notes,
  scrollKey,
  caption,
}: {
  notes: LitNote[]
  scrollKey: string
  caption: string
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const midis: number[] = []
  for (let midi = LOW; midi <= HIGH; midi += 1) midis.push(midi)
  const whites = midis.filter((midi) => !isBlack(midi))
  const blacks = midis.filter((midi) => isBlack(midi))
  const firstWhite = whiteOrdinal(whites[0] ?? LOW)

  useEffect(() => {
    const lit = scroller.current?.querySelector<HTMLElement>('[data-active="true"]')
    lit?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [scrollKey])

  return (
    <div className="piano-wrap">
      <div className="piano-scroll" ref={scroller}>
        <div className="piano" data-testid="piano" aria-hidden="true">
          <div className="white-keys">
            {whites.map((midi) => {
              const role = roleFor(midi, notes)
              return <div key={midi} className="white-key" data-role={role ?? 'off'} data-active={role ? 'true' : 'false'} />
            })}
          </div>
          {blacks.map((midi) => {
            const role = roleFor(midi, notes)
            const center = (whiteOrdinal(midi - 1) - firstWhite + 1) / whites.length
            return (
              <div
                key={midi}
                className="black-key"
                data-role={role ?? 'off'}
                data-active={role ? 'true' : 'false'}
                style={{
                  left: `calc(${center * 100}% - (100% / ${whites.length} * 0.31))`,
                  width: `calc(100% / ${whites.length} * 0.62)`,
                }}
              />
            )
          })}
        </div>
      </div>
      <div className="legend">
        <span><i className="swatch bass" /> Bass</span>
        <span><i className="swatch rh" /> Right hand</span>
        <span><i className="swatch both" /> Same key</span>
        <p>{caption}</p>
      </div>
    </div>
  )
}

function isBlack(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12)
}

function whiteOrdinal(midi: number): number {
  const map = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]
  return Math.floor(midi / 12) * 7 + map[((midi % 12) + 12) % 12]
}

function roleFor(midi: number, notes: LitNote[]): 'bass' | 'rh' | 'both' | undefined {
  let bass = false
  let rightHand = false
  for (const note of notes) {
    if (note.midi !== midi) continue
    if (note.role === 'bass') bass = true
    if (note.role === 'rh') rightHand = true
  }
  if (bass && rightHand) return 'both'
  if (bass) return 'bass'
  if (rightHand) return 'rh'
  return undefined
}
