import { describe, expect, it } from 'vitest'
import { chunkDocument } from './chunker'

const PARAGRAPHS = [
  'Retrieval-Augmented Generation (RAG) is an AI technique that combines information retrieval with text generation. Instead of relying solely on what a language model learned during training, RAG fetches relevant information from a knowledge base.',
  'Chunking is a critical step in RAG where documents are split into smaller pieces. The chunk size is important: too large and retrieval becomes imprecise, too small and context is lost.',
  'Vector databases store embeddings and enable efficient similarity search. Popular vector databases include Pinecone, Weaviate, Chroma, Milvus, and Qdrant.',
  'Common use cases for RAG include enterprise search, customer support chatbots, research assistants, and knowledge management systems. Legal research, medical information systems, and technical documentation are prime examples.',
]
const TEXT = PARAGRAPHS.join('\n\n')

const CONFIGS = [
  { chunkSize: 128, overlap: 15 },
  { chunkSize: 64, overlap: 0 },
  { chunkSize: 32, overlap: 30 },
  { chunkSize: 50, overlap: 50 },
]

const isWhitespace = (char: string | undefined): boolean => char === undefined || /\s/.test(char)

describe.each(CONFIGS)('chunkDocument(%o)', (config) => {
  const chunks = chunkDocument(TEXT, config)

  it('keeps every chunk text identical to its source range', () => {
    for (const chunk of chunks) {
      expect(chunk.text).toBe(TEXT.slice(chunk.start, chunk.end).trim())
    }
  })

  it('starts every chunk at a word boundary', () => {
    for (const chunk of chunks) {
      expect(isWhitespace(TEXT[chunk.start - 1]), `start ${chunk.start}`).toBe(true)
      expect(isWhitespace(TEXT[chunk.start]), `start ${chunk.start}`).toBe(false)
    }
  })

  it('ends the last chunk at the document end and emits nothing after it', () => {
    expect(chunks.at(-1)?.end).toBe(TEXT.length)
    expect(chunks.filter((chunk) => chunk.end === TEXT.length)).toHaveLength(1)
  })

  it('covers the whole document, skipping nothing but whitespace', () => {
    expect(chunks[0].start).toBe(0)
    for (let i = 1; i < chunks.length; i++) {
      const gap = TEXT.slice(chunks[i - 1].end, chunks[i].start)
      expect(gap.trim(), `gap before chunk ${i}`).toBe('')
      expect(chunks[i].start).toBeGreaterThan(chunks[i - 1].start)
    }
  })
})

describe('chunkDocument tail handling', () => {
  it('does not duplicate the document ending (regression: "examples. ion are prime examples. es.")', () => {
    const chunks = chunkDocument(TEXT, { chunkSize: 128, overlap: 15 })
    const last = chunks.at(-1)?.text ?? ''
    expect(last.endsWith('are prime examples.')).toBe(true)
    expect(last.split('prime examples').length - 1).toBe(1)
  })

  it('returns a single chunk for text shorter than one chunk', () => {
    const chunks = chunkDocument('Short text.', { chunkSize: 128, overlap: 15 })
    expect(chunks.map((chunk) => chunk.text)).toEqual(['Short text.'])
  })
})
