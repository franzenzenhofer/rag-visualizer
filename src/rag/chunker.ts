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

// Token estimation: roughly 4 characters per token (English average)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function estimateCharacters(tokens: number): number {
  return tokens * 4
}

export function chunkDocument(text: string, config: ChunkingConfig): Chunk[] {
  const { chunkSize, overlap } = config
  const chunks: Chunk[] = []

  // Convert token-based size to characters (500 tokens → ~2000 chars)
  const chunkChars = estimateCharacters(chunkSize)

  let start = 0
  let chunkIndex = 0

  while (start < text.length) {
    // STEP 1: Calculate target end position
    let end = Math.min(start + chunkChars, text.length)

    // STEP 2: Find best break point (only if not at document end)
    if (end < text.length) {
      // Search for sentence boundary in last 20% of chunk
      const searchStart = Math.max(start + Math.floor(chunkChars * 0.8), start)
      let breakPoint = -1

      // Prefer sentence boundaries (., !, ?)
      for (let i = end; i >= searchStart; i--) {
        const char = text[i]
        if (char === '.' || char === '!' || char === '?') {
          // Ensure punctuation is followed by space/newline (not "Dr." or "3.14")
          if (i + 1 >= text.length || text[i + 1] === ' ' || text[i + 1] === '\n') {
            breakPoint = i + 1
            break
          }
        }
      }

      // Fall back to word boundary if no sentence boundary found
      if (breakPoint === -1) {
        for (let i = end; i >= searchStart; i--) {
          if (text[i] === ' ' || text[i] === '\n') {
            breakPoint = i + 1
            break
          }
        }
      }

      if (breakPoint > start) {
        end = breakPoint
      }
    }

    // STEP 3: Create the chunk
    const chunkText = text.slice(start, end).trim()

    // Only create chunk if it meets minimum size (prevents tiny fragments)
    // Exception: if this is all remaining text, include it regardless
    const isLastChunk = end >= text.length
    const meetsMinSize = chunkText.length >= MIN_CHUNK_CHARS

    if (chunkText.length > 0 && (meetsMinSize || isLastChunk)) {
      // If last chunk is too small, merge with previous chunk
      if (isLastChunk && !meetsMinSize && chunks.length > 0) {
        const prevChunk = chunks[chunks.length - 1]
        prevChunk.text = prevChunk.text + ' ' + chunkText
        prevChunk.end = end
        prevChunk.tokenCount = estimateTokens(prevChunk.text)
      } else {
        chunks.push({
          id: `chunk-${chunkIndex}`,
          text: chunkText,
          start,
          end,
          tokenCount: estimateTokens(chunkText),
          color: CHUNK_COLORS[chunkIndex % CHUNK_COLORS.length],
        })
        chunkIndex++
      }
    }

    // STEP 4: Calculate step forward (accounting for overlap)
    // Overlap is percentage of ACTUAL chunk size, not target size
    const actualChunkSize = end - start
    const effectiveOverlapChars = Math.floor(actualChunkSize * (overlap / 100))
    const step = actualChunkSize - effectiveOverlapChars

    // Minimum step prevents near-duplicate chunks
    const minStep = Math.max(Math.ceil(actualChunkSize * 0.1), 1)
    start = start + Math.max(step, minStep)
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
