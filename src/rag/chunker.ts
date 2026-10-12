import type { Chunk, ChunkingConfig } from '../types'
import { CHUNK_COLORS } from '../types'

/**
 * CHUNKING LOGIC EXPLAINED:
 *
 * WHY CHUNK?
 * - LLMs have limited context windows (can't process entire books)
 * - Sending whole documents is slow, expensive, and dilutes relevance
 * - Chunking enables semantic search to find ONLY relevant parts
 *
 * HOW IT WORKS:
 * 1. Start at position 0 in document
 * 2. Read forward until target chunk size (e.g., 500 tokens ≈ 2000 chars)
 * 3. Find best break point (sentence boundary > word boundary)
 * 4. Create chunk with that text
 * 5. Step forward by (chunk_size - overlap) characters
 * 6. Repeat until document end
 *
 * WHY OVERLAP?
 * - Information can span chunk boundaries
 * - Example: "The answer is 42" might split as "The answer is" | "42"
 * - With 20% overlap, next chunk starts 20% BACK from current end
 * - Both chunks contain complete sentence - no context lost!
 */

// Minimum chunk size to prevent tiny fragments (50 chars ≈ 12 tokens)
const MIN_CHUNK_CHARS = 50

// Share of the target size searched backwards for a clean break point
const BREAK_SEARCH_SHARE = 0.2

// Minimum step as share of the chunk size, prevents near-duplicate chunks
const MIN_STEP_SHARE = 0.1

// Token estimation: roughly 4 characters per token (English average)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function estimateCharacters(tokens: number): number {
  return tokens * 4
}

function isWhitespace(char: string | undefined): boolean {
  return char === ' ' || char === '\n' || char === '\t' || char === '\r'
}

function isSentenceEnd(text: string, i: number): boolean {
  const char = text[i]
  const isPunctuation = char === '.' || char === '!' || char === '?'
  // Must be followed by whitespace or the end (not "Dr." or "3.14")
  return isPunctuation && (i + 1 >= text.length || isWhitespace(text[i + 1]))
}

// Prefer a sentence boundary, then a word boundary, else cut at the target end
function findChunkEnd(text: string, start: number, chunkChars: number): number {
  const end = Math.min(start + chunkChars, text.length)
  if (end >= text.length) return text.length

  const searchStart = start + Math.floor(chunkChars * (1 - BREAK_SEARCH_SHARE))
  for (let i = end; i >= searchStart; i--) {
    if (isSentenceEnd(text, i)) return i + 1
  }
  for (let i = end; i >= searchStart; i--) {
    if (isWhitespace(text[i])) return i + 1
  }
  return end
}

// Move a position forward to the start of the next word; a partial word is
// only skipped up to wordLimit so no text between chunks is ever lost
function snapToWordStart(text: string, position: number, wordLimit: number): number {
  let i = position
  // Mid-word means both neighbours are non-whitespace
  while (i > 0 && i < wordLimit && !isWhitespace(text[i - 1]) && !isWhitespace(text[i])) i++
  while (i < text.length && isWhitespace(text[i])) i++
  return i
}

// Next chunk starts (chunk size - overlap) after this one, at a word start
function nextChunkStart(text: string, start: number, end: number, overlap: number): number {
  const size = end - start
  const step = size - Math.floor(size * (overlap / 100))
  const minStep = Math.max(Math.ceil(size * MIN_STEP_SHARE), 1)
  return snapToWordStart(text, start + Math.max(step, minStep), end)
}

function createChunk(text: string, start: number, end: number, index: number): Chunk {
  const chunkText = text.slice(start, end).trim()
  return {
    id: `chunk-${index}`,
    text: chunkText,
    start,
    end,
    tokenCount: estimateTokens(chunkText),
    color: CHUNK_COLORS[index % CHUNK_COLORS.length],
  }
}

export function chunkDocument(text: string, config: ChunkingConfig): Chunk[] {
  const { chunkSize, overlap } = config
  const chunkChars = estimateCharacters(chunkSize)
  const chunks: Chunk[] = []
  let start = snapToWordStart(text, 0, text.length)

  while (start < text.length) {
    const end = findChunkEnd(text, start, chunkChars)
    const chunk = createChunk(text, start, end, chunks.length)
    const previous = chunks.at(-1)

    // A too-small final piece is merged into the previous chunk's range
    if (end >= text.length && chunk.text.length < MIN_CHUNK_CHARS && previous) {
      chunks[chunks.length - 1] = createChunk(text, previous.start, end, chunks.length - 1)
    } else if (chunk.text.length > 0) {
      chunks.push(chunk)
    }

    // The chunk that reaches the document end is the last one
    if (end >= text.length) break
    start = nextChunkStart(text, start, end, overlap)
  }

  return chunks
}

export function getChunkAtPosition(chunks: Chunk[], position: number): Chunk | null {
  for (const chunk of chunks) {
    if (position >= chunk.start && position < chunk.end) {
      return chunk
    }
  }
  return null
}
