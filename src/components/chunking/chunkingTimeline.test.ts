import { describe, expect, it } from 'vitest'
import { easeInOut, phaseDurations, snapToWordEnd } from './chunkingTimeline'

describe('phaseDurations', () => {
  it('plays the first chunk slowest and speeds up afterwards', () => {
    const first = phaseDurations(0, false)
    const second = phaseDurations(1, false)
    expect(second.scan).toBeLessThan(first.scan)
    expect(second.fly).toBeLessThan(first.fly)
  })

  it('never drops below the speed floor, so late chunks stay visible', () => {
    const late = phaseDurations(50, false)
    expect(late).toEqual(phaseDurations(20, false))
    expect(late.fly).toBeGreaterThanOrEqual(250)
  })

  it('skips sweep and flight for reduced motion', () => {
    const reduced = phaseDurations(0, true)
    expect(reduced.scan).toBe(0)
    expect(reduced.fly).toBe(0)
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
