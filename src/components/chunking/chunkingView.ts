import type { Chunk } from '../../types'
import { MIN_VISIBLE_SNAP_CHARS, easeInOut, snapToWordEnd } from './chunkingTimeline'
import type { ChunkPhase } from './chunkingTimeline'

export interface Range {
  start: number
  end: number
}

export interface DocumentView {
  // Text inside the current window (highlighted in the chunk color)
  active: Range | null
  // Text past the sentence end that the cut gives back (shrinks during snap)
  tail: Range | null
  // Text shared by the previous and the current chunk
  overlap: Range | null
  // Tokens inside the window right now, for the counter
  windowTokens: number
}

export interface ViewInput {
  phase: ChunkPhase
  progress: number
  chunk: Chunk | null
  previous: Chunk | null
  text: string
  windowChars: number
}

const EMPTY: DocumentView = { active: null, tail: null, overlap: null, windowTokens: 0 }

// Same estimate as the chunker: roughly 4 characters per token
const tokensIn = (range: Range) => Math.ceil((range.end - range.start) / 4)

// Where the window ends before the cut looks for a sentence end
export function windowLimit(chunk: Chunk, windowChars: number, textLength: number): number {
  return Math.min(chunk.start + windowChars, textLength)
}

export function hasVisibleSnap(chunk: Chunk, windowChars: number, textLength: number): boolean {
  return windowLimit(chunk, windowChars, textLength) - chunk.end >= MIN_VISIBLE_SNAP_CHARS
}

function overlapRange(chunk: Chunk, previous: Chunk | null): Range | null {
  if (!previous || chunk.start >= previous.end) return null
  return { start: chunk.start, end: previous.end }
}

export function documentView({ phase, progress, chunk, previous, text, windowChars }: ViewInput): DocumentView {
  if (!chunk) return EMPTY
  const limit = windowLimit(chunk, windowChars, text.length)
  const overlap = overlapRange(chunk, previous)
  const full: Range = { start: chunk.start, end: chunk.end }

  switch (phase) {
    case 'overlap':
      return { ...EMPTY, overlap }
    case 'window': {
      const raw = chunk.start + Math.round((limit - chunk.start) * easeInOut(progress))
      const active = { start: chunk.start, end: snapToWordEnd(text, raw, limit) }
      return { active, tail: null, overlap, windowTokens: tokensIn(active) }
    }
    case 'snap': {
      const tailEnd = Math.round(limit - (limit - chunk.end) * easeInOut(progress))
      const tail = tailEnd > chunk.end ? { start: chunk.end, end: tailEnd } : null
      return { active: full, tail, overlap, windowTokens: tokensIn(full) }
    }
    case 'cutting':
    case 'flying':
      // Cut and stored as one whole piece, overlap included
      return { active: full, tail: null, overlap: null, windowTokens: tokensIn(full) }
    default:
      return EMPTY
  }
}
