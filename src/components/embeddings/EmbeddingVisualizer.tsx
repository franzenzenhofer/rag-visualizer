import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, RotateCcw, Zap, ArrowRight, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useRAGStore } from '../../store/ragStore'
import { useUIStore } from '../../store/uiStore'
import { initializeEmbedder, embedChunks, isEmbedderReady } from '../../rag/embedder'
import { projectEmbeddings } from '../../viz/dimensionReducer'
import { LoadingSpinner } from '../shared/LoadingSpinner'

export function EmbeddingVisualizer() {
  const { t } = useTranslation()
  const {
    chunks,
    embeddings,
    setEmbeddings,
    setIsEmbedding,
    setEmbeddingProgress,
    setModelLoaded,
  } = useRAGStore()
  const { setCurrentStep } = useUIStore()

  // Processing states
  const [modelProgress, setModelProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [modelLoading, setModelLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isRunning = useRef(false)

  // Animation states
  const [currentAnimIndex, setCurrentAnimIndex] = useState(-1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showVector, setShowVector] = useState(false)
  const [showExplanation, setShowExplanation] = useState(true)
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 2D projection for scatter plot - use stored coordinates
  const points2D = useMemo(() => {
    if (embeddings.length === 0) return []
    // Use stored x,y coords from projectEmbeddings
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

  // Process embeddings
  useEffect(() => {
    async function processEmbeddings() {
      if (isRunning.current || chunks.length === 0 || embeddings.length > 0) return

      isRunning.current = true
      setIsProcessing(true)
      setIsEmbedding(true)
      setError(null)

      try {
        if (!isEmbedderReady()) {
          setModelLoading(true)
          await initializeEmbedder((progress) => setModelProgress(progress))
          setModelLoading(false)
          setModelLoaded(true)
        }

        const results = await embedChunks(chunks, (progress) => {
          setEmbeddingProgress(progress)
        })

        // Project embeddings to 2D and store coordinates
        const embeddingsWithCoords = projectEmbeddings(results)
        setEmbeddings(embeddingsWithCoords)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create embeddings')
      } finally {
        setIsProcessing(false)
        setIsEmbedding(false)
        isRunning.current = false
      }
    }

    processEmbeddings()
  }, [chunks, embeddings.length, setEmbeddings, setIsEmbedding, setEmbeddingProgress, setModelLoaded])

  // Start animation when embeddings ready
  useEffect(() => {
    if (embeddings.length > 0 && !isProcessing && currentAnimIndex === -1) {
      setTimeout(startAnimation, 300)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embeddings.length, isProcessing])

  const startAnimation = () => {
    if (isAnimating || pointsWithData.length === 0) return
    setIsAnimating(true)
    setCurrentAnimIndex(-1)

    let idx = -1
    const speed = Math.max(150, Math.min(500, 10000 / pointsWithData.length))

    const animateNext = () => {
      idx++
      setShowVector(false)
      setCurrentAnimIndex(idx)

      // Show vector after a brief delay
      setTimeout(() => setShowVector(true), speed * 0.3)

      if (idx < pointsWithData.length - 1) {
        animationRef.current = setTimeout(animateNext, speed)
      } else {
        setIsAnimating(false)
      }
    }

    animationRef.current = setTimeout(animateNext, 200)
  }

  const resetAnimation = () => {
    if (animationRef.current) clearTimeout(animationRef.current)
    setCurrentAnimIndex(-1)
    setShowVector(false)
    setIsAnimating(false)
    setTimeout(startAnimation, 300)
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current)
    }
  }, [])

  // Get current chunk and its embedding
  const currentChunk = currentAnimIndex >= 0 ? chunks[currentAnimIndex] : null
  const currentEmbedding = currentAnimIndex >= 0 ? embeddings[currentAnimIndex] : null
  const completedPoints = pointsWithData.slice(0, currentAnimIndex + 1)

  if (chunks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('errors.noChunks')}</p>
        <button onClick={() => setCurrentStep(1)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          {t('steps.chunking.title')}
        </button>
      </div>
    )
  }

  // Model loading state
  if (modelLoading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="text-center max-w-md">
          <LoadingSpinner size="lg" />
          <p className="text-xl font-bold mt-4">{t('steps.embedding.loading')}</p>
          <p className="text-gray-500 mt-2">{t('steps.embedding.loadingSize')}</p>
          <div className="h-4 bg-gray-200 rounded-full mt-4 overflow-hidden">
            <motion.div className="h-full bg-blue-600" animate={{ width: `${modelProgress}%` }} />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600">{modelProgress}%</p>
        </div>
      </div>
    )
  }

  // Processing state (after model loaded)
  if (isProcessing) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-xl font-bold mt-4">{t('steps.embedding.creating')}</p>
          <p className="text-gray-500">{t('steps.embedding.creatingNote')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-bold">{error}</p>
        <button onClick={() => { setError(null); isRunning.current = false }} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
          {t('nav.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="w-6 h-6 text-purple-600" />
          <span className="text-lg font-bold">
            {isAnimating
              ? t('steps.embedding.status.embedding', { current: currentAnimIndex + 1, total: chunks.length })
              : currentAnimIndex >= 0
                ? `✓ ${t('steps.embedding.status.complete', { count: embeddings.length })}`
                : t('steps.embedding.status.ready')}
          </span>
        </div>
        <button
          onClick={resetAnimation}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          Replay
        </button>
      </div>

      {/* Educational Explanation Panel */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full px-4 py-3 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-900 dark:text-purple-100">
              {t('steps.embedding.learnMore')}
            </span>
          </div>
          {showExplanation ? (
            <ChevronUp className="w-5 h-5 text-purple-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-purple-600" />
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
                {/* WHAT ARE EMBEDDINGS */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <h4 className="font-bold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-2">
                    <span className="text-lg">🔢</span> {t('steps.embedding.what.title')}
                  </h4>
                  <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• {t('steps.embedding.what.point1')}</li>
                    <li>• {t('steps.embedding.what.point2')}</li>
                    <li>• {t('steps.embedding.what.point3')}</li>
                  </ul>
                </div>

                {/* HOW THEY WORK */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <h4 className="font-bold text-pink-700 dark:text-pink-400 mb-2 flex items-center gap-2">
                    <span className="text-lg">🧠</span> {t('steps.embedding.howWork.title')}
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    {t('steps.embedding.howWork.explain')}
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-xs font-mono">
                    <div>{t('steps.embedding.howWork.king')}</div>
                    <div>{t('steps.embedding.howWork.queen')}</div>
                    <div className="text-green-600">{t('steps.embedding.howWork.similar')} ✓</div>
                  </div>
                </div>

                {/* WHY THEY MATTER */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <h4 className="font-bold text-indigo-700 dark:text-indigo-400 mb-2 flex items-center gap-2">
                    <span className="text-lg">✨</span> {t('steps.embedding.whyMatter.title')}
                  </h4>
                  <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• {t('steps.embedding.whyMatter.point1')}</li>
                    <li>• {t('steps.embedding.whyMatter.point2')}</li>
                    <li>• {t('steps.embedding.whyMatter.point3')}</li>
                    <li>• {t('steps.embedding.whyMatter.point4')}</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MAIN: Side-by-side view */}
      <div className="grid grid-cols-2 gap-4">
        {/* LEFT: Current chunk being transformed */}
        <div className="flex flex-col min-h-0">
          <div className="text-sm font-semibold text-gray-500 mb-2">
            📝 {t('steps.embedding.textToNumbers')}
          </div>
          <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            <ChunkTransformer
              chunk={currentChunk}
              embedding={currentEmbedding}
              showVector={showVector}
              chunkIndex={currentAnimIndex}
            />
          </div>
        </div>

        {/* RIGHT: Scatter plot */}
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-gray-500 mb-2">
            🎯 {t('steps.embedding.meaningSpace', { current: completedPoints.length, total: pointsWithData.length })}
          </div>
          <div className="h-80 bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden">
            <MeaningSpaceScatter
              points={completedPoints}
              activePointId={currentChunk?.id}
            />
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            {t('steps.embedding.projectionNote')}
          </p>
        </div>
      </div>

      {/* Big Next Step Button */}
      {!isAnimating && currentAnimIndex >= 0 && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setCurrentStep(3)}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
        >
          {t('nav.next')}
          <ArrowRight className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  )
}

// Component showing chunk text transforming into vector
function ChunkTransformer({
  chunk,
  embedding,
  showVector,
  chunkIndex,
}: {
  chunk: { id: string; text: string; color: string } | null
  embedding: { embedding: number[] } | null
  showVector: boolean
  chunkIndex: number
}) {
  const { t } = useTranslation()

  if (!chunk) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Zap className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>{t('steps.embedding.waitingForChunk')}</p>
        </div>
      </div>
    )
  }

  const vectorPreview = embedding?.embedding.slice(0, 12) || []

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Chunk header */}
      <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: chunk.color }}>
        <span className="text-white font-bold">{t('steps.embedding.chunkNumber', { number: chunkIndex + 1 })}</span>
      </div>

      {/* Chunk text */}
      <div className="flex-1 p-4 overflow-auto">
        <motion.div
          key={chunk.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-mono text-sm leading-relaxed text-gray-700 dark:text-gray-300"
        >
          {chunk.text.length > 500 ? chunk.text.slice(0, 500) + '...' : chunk.text}
        </motion.div>
      </div>

      {/* Vector transformation area */}
      <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-700">
        <AnimatePresence mode="wait">
          {showVector && embedding ? (
            <motion.div
              key="vector"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: 0 }}
                >
                  <Zap className="w-5 h-5 text-purple-600" />
                </motion.div>
                <span className="text-sm font-bold text-purple-600">{t('steps.embedding.vectorLabel')}</span>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                <span className="text-gray-500">[</span>
                {vectorPreview.map((val, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-green-400"
                  >
                    {val.toFixed(4)}
                    {i < vectorPreview.length - 1 && <span className="text-gray-500">, </span>}
                  </motion.span>
                ))}
                <span className="text-gray-500">, ... ]</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {t('steps.embedding.vectorExplain')}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 flex items-center justify-center gap-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Cpu className="w-5 h-5 text-purple-600" />
              </motion.div>
              <span className="text-purple-600 font-medium">{t('steps.embedding.converting')}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Scatter plot showing points in meaning space
function MeaningSpaceScatter({
  points,
  activePointId,
}: {
  points: Array<{ x: number; y: number; chunkId: string; text: string; color: string }>
  activePointId?: string
}) {
  const { t } = useTranslation()
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

  if (points.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-2 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center">
            <span className="text-2xl">📍</span>
          </div>
          <p>{t('steps.embedding.pointsWillAppear')}</p>
        </div>
      </div>
    )
  }

  return (
    <svg ref={svgRef} width="100%" height="100%" className="overflow-visible">
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

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((tick) => (
        <g key={tick}>
          <line
            x1={margin + tick * innerWidth}
            y1={margin}
            x2={margin + tick * innerWidth}
            y2={margin + innerHeight}
            className="stroke-gray-200 dark:stroke-gray-700"
            strokeDasharray="4,4"
          />
          <line
            x1={margin}
            y1={margin + tick * innerHeight}
            x2={margin + innerWidth}
            y2={margin + tick * innerHeight}
            className="stroke-gray-200 dark:stroke-gray-700"
            strokeDasharray="4,4"
          />
        </g>
      ))}

      {/* Points with chunk labels */}
      <AnimatePresence>
        {points.map((point, index) => {
          const cx = margin + point.x * innerWidth
          const cy = margin + (1 - point.y) * innerHeight
          const isActive = point.chunkId === activePointId
          const radius = isActive ? 20 : 14

          return (
            <motion.g
              key={point.chunkId}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
              }}
            >
              {/* Circle */}
              <motion.circle
                cx={cx}
                cy={cy}
                fill={point.color}
                stroke="white"
                strokeWidth={3}
                initial={{ r: 0 }}
                animate={{ r: radius }}
                style={{
                  filter: isActive ? `drop-shadow(0 0 12px ${point.color})` : `drop-shadow(0 2px 4px rgba(0,0,0,0.2))`,
                }}
              />
              {/* Chunk number label */}
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-white font-bold pointer-events-none"
                style={{ fontSize: isActive ? '12px' : '10px' }}
              >
                {index + 1}
              </text>
            </motion.g>
          )
        })}
      </AnimatePresence>

      {/* Axis labels */}
      <text
        x={dimensions.width / 2}
        y={dimensions.height - 8}
        textAnchor="middle"
        className="fill-gray-400 text-xs"
      >
        {t('steps.embedding.dimension1')}
      </text>
      <text
        x={12}
        y={dimensions.height / 2}
        textAnchor="middle"
        transform={`rotate(-90, 12, ${dimensions.height / 2})`}
        className="fill-gray-400 text-xs"
      >
        {t('steps.embedding.dimension2')}
      </text>
    </svg>
  )
}
