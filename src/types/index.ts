// RAG Pipeline Types

export interface Chunk {
  id: string
  text: string
  start: number
  end: number
  tokenCount: number
  color: string
}

export interface EmbeddingResult {
  chunkId: string
  embedding: number[]
  x?: number // 2D projection
  y?: number
}

export interface SearchResult {
  chunk: Chunk
  similarity: number
  embedding?: EmbeddingResult
}

export interface Document {
  id: string
  name: string
  content: string
  size: number
  type: 'txt' | 'md' | 'pdf'
}

export interface ChunkingConfig {
  chunkSize: number
  overlap: number
}

export interface RAGState {
  // Document
  document: Document | null
  setDocument: (doc: Document | null) => void

  // Chunking
  chunks: Chunk[]
  setChunks: (chunks: Chunk[]) => void
  chunkingConfig: ChunkingConfig
  setChunkingConfig: (config: Partial<ChunkingConfig>) => void

  // Embeddings
  embeddings: EmbeddingResult[]
  setEmbeddings: (embeddings: EmbeddingResult[]) => void
  isEmbedding: boolean
  setIsEmbedding: (loading: boolean) => void
  embeddingProgress: number
  setEmbeddingProgress: (progress: number) => void
  modelLoaded: boolean
  setModelLoaded: (loaded: boolean) => void

  // Search
  query: string
  setQuery: (query: string) => void
  queryEmbedding: number[] | null
  setQueryEmbedding: (embedding: number[] | null) => void
  searchResults: SearchResult[]
  setSearchResults: (results: SearchResult[]) => void
  topK: number
  setTopK: (k: number) => void

  // Reset
  reset: () => void
}

export interface UIState {
  currentStep: number
  setCurrentStep: (step: number) => void
  language: 'en' | 'de'
  setLanguage: (lang: 'en' | 'de') => void
}

export type Step = {
  id: number
  key: string
  titleKey: string
  descriptionKey: string
}

export const STEPS: Step[] = [
  { id: 0, key: 'upload', titleKey: 'steps.upload.title', descriptionKey: 'steps.upload.description' },
  { id: 1, key: 'chunking', titleKey: 'steps.chunking.title', descriptionKey: 'steps.chunking.description' },
  { id: 2, key: 'embedding', titleKey: 'steps.embedding.title', descriptionKey: 'steps.embedding.description' },
  { id: 3, key: 'retrieval', titleKey: 'steps.retrieval.title', descriptionKey: 'steps.retrieval.description' },
  { id: 4, key: 'generation', titleKey: 'steps.generation.title', descriptionKey: 'steps.generation.description' },
]

// Chunk colors for visualization (10 distinct colors)
export const CHUNK_COLORS = [
  '#f87171', // red
  '#fb923c', // orange
  '#facc15', // yellow
  '#4ade80', // green
  '#2dd4bf', // teal
  '#38bdf8', // sky
  '#818cf8', // blue
  '#c084fc', // purple
  '#f472b6', // pink
  '#fb7185', // rose
]
