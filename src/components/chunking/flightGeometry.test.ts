import { describe, expect, it } from 'vitest'
import { computeFlight } from './flightGeometry'
import type { FlightInput } from './flightGeometry'

const SLOT = { left: 700, top: 400, width: 500, height: 150 }

const base: FlightInput = {
  contentLeft: 100,
  contentWidth: 400,
  visibleTop: 300,
  visibleBottom: 700,
  selection: { left: 100, top: 350, width: 400, height: 120 },
  firstLineLeft: 100,
  slot: SLOT,
}

describe('computeFlight', () => {
  it('starts exactly on a fully visible selection and lands on the slot', () => {
    const flight = computeFlight(base)
    expect(flight.from).toEqual({ left: 100, top: 350, width: 400, height: 120 })
    expect(flight.to).toEqual(SLOT)
    expect(flight.textTop).toBe(0)
    expect(flight.textIndent).toBe(0)
  })

  it('indents the first line when the chunk starts mid-line', () => {
    const flight = computeFlight({ ...base, firstLineLeft: 260, selection: { left: 100, top: 350, width: 400, height: 120 } })
    expect(flight.textIndent).toBe(160)
    expect(flight.textWidth).toBe(400)
  })

  it('clips a selection that runs past the bottom of the panel', () => {
    const flight = computeFlight({ ...base, selection: { left: 100, top: 600, width: 400, height: 300 } })
    expect(flight.from.top).toBe(600)
    expect(flight.from.height).toBe(100)
  })

  it('clips a selection scrolled above the panel and shifts the text up', () => {
    const flight = computeFlight({ ...base, selection: { left: 100, top: 250, width: 400, height: 200 } })
    expect(flight.from.top).toBe(300)
    expect(flight.from.height).toBe(150)
    expect(flight.textTop).toBe(-50)
  })
})
