/**
 * CHUNKING ANIMATION TIMELINE
 *
 * The step tells one story per chunk, so a learner can follow where every
 * chunk comes from:
 * 1. reading  - the whole document is shown alone first
 * 2. scanning - a highlight sweeps word by word over the next ~N tokens
 * 3. cutting  - a scissors mark shows where the chunk ends
 * 4. flying   - the selected text lifts out of the document into the list
 *
 * The first chunk plays slowly, later ones speed up so long documents
 * do not drag.
 */

export type ChunkPhase = 'idle' | 'reading' | 'scanning' | 'cutting' | 'flying' | 'done'

export interface PhaseDurations {
  scan: number
  cut: number
  fly: number
}

// Long enough to scroll the panels into view and take in the whole document
export const READING_MS = 2200

const FIRST_CHUNK_MS: PhaseDurations = { scan: 2000, cut: 700, fly: 1000 }
const REDUCED_MOTION_MS: PhaseDurations = { scan: 0, cut: 250, fly: 0 }

// Each chunk plays at 75% of the previous one, never faster than 30%
const SPEEDUP_PER_CHUNK = 0.75
const MIN_SPEED_FACTOR = 0.3

export function phaseDurations(chunkIndex: number, reducedMotion: boolean): PhaseDurations {
  if (reducedMotion) return REDUCED_MOTION_MS
  const factor = Math.max(MIN_SPEED_FACTOR, SPEEDUP_PER_CHUNK ** chunkIndex)
  return {
    scan: Math.round(FIRST_CHUNK_MS.scan * factor),
    cut: Math.round(FIRST_CHUNK_MS.cut * factor),
    fly: Math.round(FIRST_CHUNK_MS.fly * factor),
  }
}

// Ease-in-out so the sweep starts and ends gently
export function easeInOut(progress: number): number {
  return progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2
}

// The sweep reveals whole words: move forward to the end of the current word
export function snapToWordEnd(text: string, position: number, limit: number): number {
  let i = position
  while (i < limit && !/\s/.test(text[i] ?? '')) i++
  return i
}
