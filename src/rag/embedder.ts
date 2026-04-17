import type { Chunk, EmbeddingResult } from '../types'

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let embeddingPipeline: any = null
let isLoading = false

export async function initializeEmbedder(
  onProgress?: (progress: number) => void
): Promise<void> {
  if (embeddingPipeline) return
  if (isLoading) {
    // Wait for existing load to complete
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return
  }

  isLoading = true

  try {
    // Dynamic import to avoid issues with module initialization
    const { pipeline, env } = await import('@xenova/transformers')

    // Configure Transformers.js to use browser cache
    env.allowLocalModels = false
    env.useBrowserCache = true

    embeddingPipeline = await pipeline('feature-extraction', MODEL_NAME, {
      progress_callback: (data: { progress: number }) => {
        if (onProgress && typeof data.progress === 'number') {
          onProgress(Math.round(data.progress))
        }
      },
    })
  } finally {
    isLoading = false
  }
}

export async function embedText(text: string): Promise<number[]> {
  if (!embeddingPipeline) {
    throw new Error('Embedder not initialized. Call initializeEmbedder first.')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = { pooling: 'mean', normalize: true }
  const output = await embeddingPipeline(text, options)

  // Convert to regular array - output.data contains the embedding
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Array.from((output as any).data as Float32Array)
}

export async function embedChunks(
  chunks: Chunk[],
  onProgress?: (progress: number) => void
): Promise<EmbeddingResult[]> {
  if (!embeddingPipeline) {
    throw new Error('Embedder not initialized. Call initializeEmbedder first.')
  }

  const results: EmbeddingResult[] = []

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await embedText(chunks[i].text)
    results.push({
      chunkId: chunks[i].id,
      embedding,
    })

    if (onProgress) {
      onProgress(Math.round(((i + 1) / chunks.length) * 100))
    }
  }

  return results
}

export function isEmbedderReady(): boolean {
  return embeddingPipeline !== null
}

// Cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return 0

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}
