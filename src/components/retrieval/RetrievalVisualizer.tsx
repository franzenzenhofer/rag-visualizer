import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Zap, RotateCcw, ArrowRight, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useRAGStore } from '../../store/ragStore'
import { useUIStore } from '../../store/uiStore'
import { embedText, cosineSimilarity } from '../../rag/embedder'
// Note: We no longer import reduceToTwoD here - we use pre-computed coords from embeddings
import { LoadingSpinner } from '../shared/LoadingSpinner'

export function RetrievalVisualizer() {
  const { t } = useTranslation()
  const {
    chunks,
    embeddings,
    query,
    setQuery,
    queryEmbedding,
    setQueryEmbedding,
    searchResults,
    setSearchResults,
    topK,
    setTopK,
  } = useRAGStore()
  const { setCurrentStep } = useUIStore()

  const [isSearching, setIsSearching] = useState(false)
  const [showQueryVector, setShowQueryVector] = useState(false)
  const [searchPhase, setSearchPhase] = useState<'idle' | 'embedding' | 'searching' | 'done'>('idle')
  const [highlightedChunks, setHighlightedChunks] = useState<Set<string>>(new Set())
  const [showExplanation, setShowExplanation] = useState(true)

  // 2D projection for scatter plot - use pre-computed coordinates from embeddings
  const points2D = useMemo(() => {
    if (embeddings.length === 0) return []
    // Use stored x,y coords from EmbeddingVisualizer's projectEmbeddings
    return embeddings.map(e => ({
      x: e.x ?? 0,
      y: e.y ?? 0,
      chunkId: e.chunkId,
    }))
  }, [embeddings])

  const pointsWithData = useMemo(() => {
    return points2D.map((point) => {
      const chunk = chunks.find((c) => c.id === point.chunkId)
      return { ...point, text: chunk?.text || '', color: chunk?.color || '#6366f1' }
    })
  }, [points2D, chunks])

  // Query point in 2D: place at weighted average of top-K search results
  // This avoids running UMAP twice with different coordinate systems
  const queryPoint2D = useMemo(() => {
    if (!queryEmbedding || searchResults.length === 0) return null

    // Calculate weighted average position based on similarity scores
    let sumX = 0, sumY = 0, sumWeight = 0
    const topResults = searchResults.slice(0, topK)

    for (const result of topResults) {
      const point = embeddings.find(e => e.chunkId === result.chunk.id)
      if (point?.x !== undefined && point?.y !== undefined) {
        const weight = Math.max(0, result.similarity)
        sumX += point.x * weight
        sumY += point.y * weight
        sumWeight += weight
      }
    }

    return sumWeight > 0
      ? { x: sumX / sumWeight, y: sumY / sumWeight }
      : null
  }, [queryEmbedding, searchResults, embeddings, topK])

  const handleSearch = async () => {
    if (!query.trim() || embeddings.length === 0) return

    setIsSearching(true)
    setSearchPhase('embedding')
    setShowQueryVector(false)
    setHighlightedChunks(new Set())

    try {
      // Step 1: Embed the query
      const qEmb = await embedText(query)
      setQueryEmbedding(qEmb)
      setShowQueryVector(true)

      // Step 2: Calculate similarities
      await new Promise(r => setTimeout(r, 500)) // Let user see vector
      setSearchPhase('searching')

      const similarities = embeddings.map((emb) => ({
        chunkId: emb.chunkId,
        similarity: cosineSimilarity(qEmb, emb.embedding),
      }))

      similarities.sort((a, b) => b.similarity - a.similarity)
      const topResults = similarities.slice(0, topK)

      // Animate highlighting each match
      for (let i = 0; i < topResults.length; i++) {
        await new Promise(r => setTimeout(r, 300))
        setHighlightedChunks(prev => new Set([...prev, topResults[i].chunkId]))
      }

      // Map to full results
      const results = topResults.map((sim) => {
        const chunk = chunks.find((c) => c.id === sim.chunkId)!
        const embedding = embeddings.find((e) => e.chunkId === sim.chunkId)
        return { chunk, similarity: sim.similarity, embedding }
      })

      setSearchResults(results)
      setSearchPhase('done')
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const resetSearch = () => {
    setSearchPhase('idle')
    setShowQueryVector(false)
    setHighlightedChunks(new Set())
    setSearchResults([])
    setQueryEmbedding(null)
  }

  if (embeddings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No embeddings available. Create embeddings first.</p>
        <button onClick={() => setCurrentStep(2)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          Go to Embeddings
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Search className="w-6 h-6 text-green-600" />
          <span className="text-lg font-bold">
            {searchPhase === 'embedding' && 'Converting question to vector...'}
            {searchPhase === 'searching' && `Finding closest matches...`}
            {searchPhase === 'done' && `✓ Found ${searchResults.length} matches`}
            {searchPhase === 'idle' && 'Ask a question to search'}
          </span>
        </div>
        {searchPhase !== 'idle' && (
          <button
            onClick={resetSearch}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            New Search
          </button>
        )}
      </div>

      {/* Educational Explanation Panel */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl border border-green-200 dark:border-green-800">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full px-4 py-3 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-900 dark:text-green-100">
              {t('steps.retrieval.learnMore')}
            </span>
          </div>
          {showExplanation ? (
            <ChevronUp className="w-5 h-5 text-green-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-green-600" />
          )}
        </button>
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {/* WHAT HAPPENS */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <h4 className="font-bold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                    <span className="text-lg">🔍</span> WHAT Happens Here?
                  </h4>
                  <ol className="space-y-1 text-gray-700 dark:text-gray-300">
                    <li>1. Your question → <strong>vector</strong></li>
                    <li>2. Compare to all chunk vectors</li>
                    <li>3. Find <strong>closest matches</strong></li>
                    <li>4. Return top {topK} results</li>
                  </ol>
                </div>

                {/* HOW SIMILARITY WORKS */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <h4 className="font-bold text-teal-700 dark:text-teal-400 mb-2 flex items-center gap-2">
                    <span className="text-lg">📐</span> Cosine Similarity
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Measures <strong>angle</strong> between vectors:
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-xs font-mono">
                    <div>• 100% = identical meaning</div>
                    <div>• 90%+ = very relevant</div>
                    <div>• 70%+ = somewhat related</div>
                  </div>
                </div>

                {/* WHY IT'S SMART */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                    <span className="text-lg">🧠</span> WHY It's Smart
                  </h4>
                  <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• Finds <strong>meaning</strong>, not just keywords</li>
                    <li>• "car" matches "automobile"</li>
                    <li>• "happy" matches "joyful"</li>
                    <li>• Works across <strong>synonyms</strong>!</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MAIN: Side-by-side view */}
      <div className="grid grid-cols-2 gap-4">
        {/* LEFT: Question input and vector */}
        <div className="flex flex-col min-h-0 gap-4">
          {/* Search input */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('steps.retrieval.queryPlaceholder')}
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-lg"
                disabled={isSearching}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
              >
                {isSearching ? <LoadingSpinner size="sm" /> : t('steps.retrieval.search')}
              </button>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <span className="text-sm text-gray-500">Results:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-lg font-bold text-green-600">{topK}</span>
            </div>
          </div>

          {/* Question → Vector transformation */}
          <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            <QueryTransformer
              query={query}
              queryEmbedding={queryEmbedding}
              showVector={showQueryVector}
              searchPhase={searchPhase}
            />
          </div>
        </div>

        {/* RIGHT: Scatter plot with search visualization */}
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-gray-500 mb-2">
            🎯 Meaning Space - {highlightedChunks.size > 0 ? `${highlightedChunks.size} matches found` : 'searching...'}
          </div>
          <div className="h-80 bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden">
            <SearchScatterPlot
              points={pointsWithData}
              queryPoint={queryPoint2D}
              highlightedChunks={highlightedChunks}
              searchPhase={searchPhase}
            />
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            2D projection of 384D vectors. Query point (Q) is placed near its best matches.
          </p>
        </div>
      </div>

      {/* BOTTOM: Retrieved chunks */}
      {searchResults.length > 0 && searchPhase === 'done' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-green-700">Retrieved Chunks</span>
            <ArrowRight className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-500">These will be used to answer your question</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {searchResults.map((result, i) => (
              <motion.div
                key={result.chunk.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex-shrink-0 w-64 rounded-lg overflow-hidden border-2"
                style={{ borderColor: result.chunk.color }}
              >
                <div
                  className="px-3 py-1.5 flex items-center justify-between"
                  style={{ backgroundColor: result.chunk.color }}
                >
                  <span className="text-white font-bold text-sm">#{i + 1} Match</span>
                  <span className="text-white/90 text-sm">{Math.round(result.similarity * 100)}%</span>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                  {result.chunk.text}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Big Next Step Button */}
      {searchResults.length > 0 && searchPhase === 'done' && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setCurrentStep(4)}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
        >
          {t('nav.next')}
          <ArrowRight className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  )
}

// Query transformation component
function QueryTransformer({
  query,
  queryEmbedding,
  showVector,
  searchPhase,
}: {
  query: string
  queryEmbedding: number[] | null
  showVector: boolean
  searchPhase: string
}) {
  if (!query.trim()) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Search className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Enter a question to search</p>
        </div>
      </div>
    )
  }

  const vectorPreview = queryEmbedding?.slice(0, 12) || []

  return (
    <div className="flex-1 flex flex-col">
      {/* Question display */}
      <div className="px-4 py-3 bg-purple-600">
        <span className="text-white font-bold">Your Question</span>
      </div>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">"{query}"</p>
      </div>

      {/* Vector transformation */}
      <div className="flex-1 p-4">
        <AnimatePresence mode="wait">
          {searchPhase === 'embedding' && !showVector && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-3 h-full"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-6 h-6 text-purple-600" />
              </motion.div>
              <span className="text-purple-600 font-medium">Converting question to vector...</span>
            </motion.div>
          )}

          {showVector && queryEmbedding && (
            <motion.div
              key="vector"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-bold text-purple-600">→ Question Vector (384 numbers):</span>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs">
                <span className="text-gray-500">[</span>
                {vectorPreview.map((val, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-purple-400"
                  >
                    {val.toFixed(4)}
                    {i < vectorPreview.length - 1 && <span className="text-gray-500">, </span>}
                  </motion.span>
                ))}
                <span className="text-gray-500">, ... ]</span>
              </div>

              {searchPhase === 'searching' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 flex items-center gap-2 text-green-600"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  >
                    <Search className="w-5 h-5" />
                  </motion.div>
                  <span className="font-medium">Comparing with all chunk vectors...</span>
                </motion.div>
              )}

              {searchPhase === 'done' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-green-600 font-medium"
                >
                  ✓ Found the closest matches!
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Scatter plot with search visualization
function SearchScatterPlot({
  points,
  queryPoint,
  highlightedChunks,
  searchPhase,
}: {
  points: Array<{ x: number; y: number; chunkId: string; text: string; color: string }>
  queryPoint: { x: number; y: number } | null | undefined
  highlightedChunks: Set<string>
  searchPhase: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 })

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current?.parentElement) {
        const rect = svgRef.current.parentElement.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const margin = 40
  const innerWidth = dimensions.width - margin * 2
  const innerHeight = dimensions.height - margin * 2

  const getCoords = (x: number, y: number) => ({
    cx: margin + x * innerWidth,
    cy: margin + (1 - y) * innerHeight,
  })

  return (
    <svg ref={svgRef} width="100%" height="100%">
      {/* Grid */}
      <rect
        x={margin}
        y={margin}
        width={innerWidth}
        height={innerHeight}
        fill="transparent"
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth={1}
        rx={8}
      />

      {/* Connection lines from query to highlighted chunks */}
      {queryPoint && searchPhase !== 'idle' && (
        <g>
          {points
            .filter((p) => highlightedChunks.has(p.chunkId))
            .map((point) => {
              const q = getCoords(queryPoint.x, queryPoint.y)
              const p = getCoords(point.x, point.y)
              return (
                <motion.line
                  key={`line-${point.chunkId}`}
                  x1={q.cx}
                  y1={q.cy}
                  x2={p.cx}
                  y2={p.cy}
                  stroke={point.color}
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{ duration: 0.5 }}
                />
              )
            })}
        </g>
      )}

      {/* Document points with chunk labels */}
      {points.map((point, index) => {
        const { cx, cy } = getCoords(point.x, point.y)
        const isHighlighted = highlightedChunks.has(point.chunkId)
        const radius = isHighlighted ? 20 : 14

        return (
          <g key={point.chunkId}>
            <motion.circle
              cx={cx}
              cy={cy}
              fill={point.color}
              stroke="white"
              strokeWidth={3}
              initial={{ r: 14 }}
              animate={{
                r: radius,
                opacity: searchPhase === 'searching' || searchPhase === 'done'
                  ? (isHighlighted ? 1 : 0.3)
                  : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                filter: isHighlighted ? `drop-shadow(0 0 12px ${point.color})` : `drop-shadow(0 2px 4px rgba(0,0,0,0.2))`,
              }}
            />
            {/* Chunk number label */}
            <motion.text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-white font-bold pointer-events-none"
              style={{ fontSize: isHighlighted ? '12px' : '10px' }}
              animate={{
                opacity: searchPhase === 'searching' || searchPhase === 'done'
                  ? (isHighlighted ? 1 : 0.3)
                  : 1,
              }}
            >
              {index + 1}
            </motion.text>
          </g>
        )
      })}

      {/* Query point */}
      {queryPoint && searchPhase !== 'idle' && (
        <motion.g initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}>
          {/* Pulsing ring */}
          <motion.circle
            cx={getCoords(queryPoint.x, queryPoint.y).cx}
            cy={getCoords(queryPoint.x, queryPoint.y).cy}
            fill="none"
            stroke="#9333ea"
            strokeWidth={2}
            initial={{ r: 10 }}
            animate={{ r: [10, 30, 10], opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          {/* Query marker */}
          <circle
            cx={getCoords(queryPoint.x, queryPoint.y).cx}
            cy={getCoords(queryPoint.x, queryPoint.y).cy}
            r={12}
            fill="#9333ea"
            stroke="white"
            strokeWidth={3}
          />
          <text
            x={getCoords(queryPoint.x, queryPoint.y).cx}
            y={getCoords(queryPoint.x, queryPoint.y).cy + 4}
            textAnchor="middle"
            className="fill-white text-xs font-bold"
          >
            Q
          </text>
        </motion.g>
      )}
    </svg>
  )
}
