import { UMAP } from 'umap-js'
import type { EmbeddingResult } from '../types'

export interface Point2D {
  x: number
  y: number
  chunkId: string
}

export function reduceToTwoD(embeddings: EmbeddingResult[]): Point2D[] {
  if (embeddings.length === 0) return []

  // UMAP needs at least 2 points
  if (embeddings.length === 1) {
    return [{ x: 0, y: 0, chunkId: embeddings[0].chunkId }]
  }

  // Prepare data for UMAP
  const vectors = embeddings.map((e) => e.embedding)

  // Configure UMAP
  const umap = new UMAP({
    nNeighbors: Math.min(15, embeddings.length - 1),
    minDist: 0.1,
    nComponents: 2,
  })

  // Fit and transform
  const projection = umap.fit(vectors)

  // Normalize to 0-1 range
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity

  for (const point of projection) {
    minX = Math.min(minX, point[0])
    maxX = Math.max(maxX, point[0])
    minY = Math.min(minY, point[1])
    maxY = Math.max(maxY, point[1])
  }

  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1

  return projection.map((point: number[], index: number) => ({
    x: (point[0] - minX) / rangeX,
    y: (point[1] - minY) / rangeY,
    chunkId: embeddings[index].chunkId,
  }))
}

/**
 * Project embeddings to 2D and store coordinates in the embedding objects.
 * This ensures all document points use the same UMAP projection.
 */
export function projectEmbeddings(embeddings: EmbeddingResult[]): EmbeddingResult[] {
  if (embeddings.length === 0) return []

  const points2D = reduceToTwoD(embeddings)
  return embeddings.map((e, i) => ({
    ...e,
    x: points2D[i].x,
    y: points2D[i].y,
  }))
}

export function computeSimilarityMatrix(embeddings: EmbeddingResult[]): number[][] {
  const n = embeddings.length
  const matrix: number[][] = []

  for (let i = 0; i < n; i++) {
    matrix[i] = []
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1
      } else if (j < i) {
        matrix[i][j] = matrix[j][i] // Use already computed value
      } else {
        // Compute cosine similarity
        const a = embeddings[i].embedding
        const b = embeddings[j].embedding
        let dot = 0
        for (let k = 0; k < a.length; k++) {
          dot += a[k] * b[k]
        }
        matrix[i][j] = dot // Already normalized vectors
      }
    }
  }

  return matrix
}
