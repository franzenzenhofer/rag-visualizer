/**
 * CHUNKING ANIMATION TIMELINE
 *
 * The step shows the real chunking algorithm, one chunk at a time:
 * 1. reading - the whole document is shown first
 * 2. overlap - (from chunk 2 on) the next window starts inside the previous chunk
 * 3. window  - a window of N tokens sweeps over the text, a counter ticks up
 * 4. snap    - the cut moves back to the last sentence end
 * 5. cutting - the chunk is cut
 * 6. flying  - the chunk is stored: it flies into the chunk list
 *
 * Durations are at 1x speed. The first two chunks play at full length so the
 * algorithm can be followed, later chunks speed up gently.
 */

export type ChunkPhase = 'idle' | 'reading' | 'overlap' | 'window' | 'snap' | 'cutting' | 'flying' | 'done'

export type ChunkStepPhase = Exclude<ChunkPhase, 'idle' | 'reading' | 'done'>

export const ALGORITHM_PHASES: ChunkStepPhase[] = ['window', 'snap', 'cutting', 'flying', 'overlap']

export type PhaseDurations = Record<ChunkStepPhase, number>

const FULL_LENGTH_MS: PhaseDurations = { overlap: 2500, window: 3500, snap: 1500, cutting: 1200, flying: 1800 }
const REDUCED_MOTION_MS: PhaseDurations = { overlap: 1200, window: 0, snap: 0, cutting: 1200, flying: 0 }

export const READING_MS = 3000
export const REDUCED_MOTION_READING_MS = 1500

// Chunks 1 and 2 play at full length, then each one at 80%, never below 45%
const FULL_LENGTH_CHUNKS = 2
const SPEEDUP_PER_CHUNK = 0.8
const MIN_SPEED_FACTOR = 0.45

// A snap shorter than this is not worth showing
export const MIN_VISIBLE_SNAP_CHARS = 3

export const PLAYBACK_SPEEDS = [0.5, 1, 2] as const
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number]

export function phaseDurations(chunkIndex: number, reducedMotion: boolean): PhaseDurations {
  if (reducedMotion) return REDUCED_MOTION_MS
  const extraChunks = Math.max(0, chunkIndex - FULL_LENGTH_CHUNKS + 1)
  const factor = Math.max(MIN_SPEED_FACTOR, SPEEDUP_PER_CHUNK ** extraChunks)
  const scaled = Object.entries(FULL_LENGTH_MS).map(([phase, ms]) => [phase, Math.round(ms * factor)])
  return Object.fromEntries(scaled) as PhaseDurations
}

// Ease-in-out so sweeps and flights start and end gently
export function easeInOut(progress: number): number {
  return progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2
}

// The sweep reveals whole words: move forward to the end of the current word
export function snapToWordEnd(text: string, position: number, limit: number): number {
  let i = position
  while (i < limit && !/\s/.test(text[i] ?? '')) i++
  return i
}
