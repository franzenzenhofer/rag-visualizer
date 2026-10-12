import { describe, expect, it } from 'vitest'
import { easeInOut, phaseDurations, snapToWordEnd } from './chunkingTimeline'

describe('phaseDurations', () => {
  it('plays the first two chunks at full length', () => {
    expect(phaseDurations(1, false)).toEqual(phaseDurations(0, false))
    expect(phaseDurations(0, false).window).toBeGreaterThanOrEqual(3000)
  })

  it('speeds up later chunks gently and never below the floor', () => {
    expect(phaseDurations(2, false).window).toBeLessThan(phaseDurations(1, false).window)
    expect(phaseDurations(50, false)).toEqual(phaseDurations(30, false))
    expect(phaseDurations(50, false).flying).toBeGreaterThanOrEqual(800)
  })

  it('skips sweeps and flights for reduced motion but keeps the explaining holds', () => {
    const reduced = phaseDurations(0, true)
    expect(reduced.window).toBe(0)
    expect(reduced.flying).toBe(0)
    expect(reduced.cutting).toBeGreaterThan(0)
  })
})

describe('easeInOut', () => {
  it('maps 0 to 0, 0.5 to 0.5 and 1 to 1', () => {
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(0.5)).toBe(0.5)
    expect(easeInOut(1)).toBe(1)
  })
})

describe('snapToWordEnd', () => {
  const text = 'The answer is 42'

  it('moves a mid-word position to the end of that word', () => {
    expect(snapToWordEnd(text, 5, text.length)).toBe(10)
  })

  it('keeps a position that already sits on whitespace', () => {
    expect(snapToWordEnd(text, 3, text.length)).toBe(3)
  })

  it('never moves past the limit', () => {
    expect(snapToWordEnd(text, 5, 7)).toBe(7)
  })
})
