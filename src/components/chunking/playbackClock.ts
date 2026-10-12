/**
 * A virtual clock for the chunking animation.
 *
 * Every phase waits on this clock instead of setTimeout, so pause, speed and
 * "next step" work everywhere, also in the middle of a sweep or a flight.
 * The timeline is sequential, so there is at most one pending wait.
 */

interface PendingWait {
  start: number
  duration: number
  resolve: (alive: boolean) => void
  onProgress?: (progress: number) => void
}

// A hidden tab delivers one huge frame later: never jump more than this
const MAX_FRAME_MS = 100

export class PlaybackClock {
  private time = 0
  private pending: PendingWait | null = null
  private cancelled = false
  speed = 1
  paused = false

  // Resolves true when the duration has passed, false when the clock was cancelled
  wait(duration: number, onProgress?: (progress: number) => void): Promise<boolean> {
    if (this.cancelled) return Promise.resolve(false)
    return new Promise((resolve) => {
      this.pending = { start: this.time, duration, resolve, onProgress }
      this.report()
    })
  }

  tick(frameMs: number): void {
    if (this.paused || !this.pending) return
    this.time += Math.min(frameMs, MAX_FRAME_MS) * this.speed
    this.report()
  }

  // Jump to the end of the current phase
  skipPhase(): void {
    if (!this.pending) return
    this.time = this.pending.start + this.pending.duration
    this.report()
  }

  cancel(): void {
    this.cancelled = true
    const pending = this.pending
    this.pending = null
    pending?.resolve(false)
  }

  private report(): void {
    const pending = this.pending
    if (!pending) return
    const progress = pending.duration > 0 ? Math.min(1, (this.time - pending.start) / pending.duration) : 1
    pending.onProgress?.(progress)
    if (progress < 1) return
    this.pending = null
    pending.resolve(true)
  }
}
