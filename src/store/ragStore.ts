import { create } from 'zustand'
import type { RAGState, Document, Chunk, EmbeddingResult, SearchResult, ChunkingConfig } from '../types'

const initialChunkingConfig: ChunkingConfig = {
  chunkSize: 128,
  overlap: 15,
}

export const useRAGStore = create<RAGState>((set, get) => ({
  // Document
  document: null,
  setDocument: (doc: Document | null) => set({ document: doc }),

  // Chunking
  chunks: [],
  setChunks: (chunks: Chunk[]) => set({
    chunks,
    // Invalidate downstream state when chunks change
    embeddings: [],
    embeddingProgress: 0,
    query: '',
    queryEmbedding: null,
    searchResults: [],
  }),
  chunkingConfig: initialChunkingConfig,
  setChunkingConfig: (config: Partial<ChunkingConfig>) => set({
    chunkingConfig: { ...get().chunkingConfig, ...config }
  }),

  // Embeddings
  embeddings: [],
  setEmbeddings: (embeddings: EmbeddingResult[]) => set({ embeddings }),
  isEmbedding: false,
  setIsEmbedding: (loading: boolean) => set({ isEmbedding: loading }),
  embeddingProgress: 0,
  setEmbeddingProgress: (progress: number) => set({ embeddingProgress: progress }),
  modelLoaded: false,
  setModelLoaded: (loaded: boolean) => set({ modelLoaded: loaded }),

  // Search
  query: '',
  setQuery: (query: string) => set({ query }),
  queryEmbedding: null,
  setQueryEmbedding: (embedding: number[] | null) => set({ queryEmbedding: embedding }),
  searchResults: [],
  setSearchResults: (results: SearchResult[]) => set({ searchResults: results }),
  topK: 5,
  setTopK: (k: number) => set({ topK: k }),

  // Reset
  reset: () => set({
    document: null,
    chunks: [],
    embeddings: [],
    isEmbedding: false,
    embeddingProgress: 0,
    query: '',
    queryEmbedding: null,
    searchResults: [],
  }),
}))
