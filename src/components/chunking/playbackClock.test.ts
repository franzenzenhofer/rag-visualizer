import { describe, expect, it } from 'vitest'
import { PlaybackClock } from './playbackClock'

describe('PlaybackClock', () => {
  it('reports progress and resolves when the duration has passed', async () => {
    const clock = new PlaybackClock()
    const seen: number[] = []
    const done = clock.wait(200, (p) => seen.push(p))
    clock.tick(50)
    clock.tick(50)
    clock.tick(100)
    await expect(done).resolves.toBe(true)
    expect(seen).toEqual([0, 0.25, 0.5, 1])
  })

  it('does not advance while paused', () => {
    const clock = new PlaybackClock()
    let progress = 0
    void clock.wait(100, (p) => (progress = p))
    clock.paused = true
    clock.tick(80)
    expect(progress).toBe(0)
    clock.paused = false
    clock.tick(50)
    expect(progress).toBe(0.5)
  })

  it('runs faster at a higher speed', () => {
    const clock = new PlaybackClock()
    let progress = 0
    void clock.wait(100, (p) => (progress = p))
    clock.speed = 2
    clock.tick(25)
    expect(progress).toBe(0.5)
  })

  it('jumps to the end of the phase on skipPhase', async () => {
    const clock = new PlaybackClock()
    const done = clock.wait(5000)
    clock.skipPhase()
    await expect(done).resolves.toBe(true)
  })

  it('resolves false on cancel and refuses new waits', async () => {
    const clock = new PlaybackClock()
    const done = clock.wait(5000)
    clock.cancel()
    await expect(done).resolves.toBe(false)
    await expect(clock.wait(10)).resolves.toBe(false)
  })

  it('finishes a zero-length wait at once', async () => {
    await expect(new PlaybackClock().wait(0)).resolves.toBe(true)
  })
})
