import { useEffect, useState, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Scissors, Settings2, RotateCcw, ArrowRight, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useRAGStore } from '../../store/ragStore'
import { useUIStore } from '../../store/uiStore'
import { chunkDocument } from '../../rag/chunker'

export function ChunkingVisualizer() {
  const { t } = useTranslation()
  const { document, chunks, setChunks, chunkingConfig, setChunkingConfig } = useRAGStore()
  const { setCurrentStep } = useUIStore()

  const [currentChunkIndex, setCurrentChunkIndex] = useState(-1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [showingDocumentFirst, setShowingDocumentFirst] = useState(true)
  const [showExplanation, setShowExplanation] = useState(true)
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const activeSelectionRef = useRef<HTMLSpanElement>(null)

  // Rechunk when config changes
  useEffect(() => {
    if (document) {
      const newChunks = chunkDocument(document.content, chunkingConfig)
      setChunks(newChunks)
      setCurrentChunkIndex(-1)
      setIsAnimating(false)
      setShowingDocumentFirst(true)
    }
  }, [document, chunkingConfig, setChunks])

  // Auto-start animation when chunks ready - with delay to show document first
  useEffect(() => {
    if (chunks.length > 0 && currentChunkIndex === -1 && !isAnimating && showingDocumentFirst) {
      // Show document for 1.5 seconds first, then start animation
      const timer = setTimeout(() => {
        setShowingDocumentFirst(false)
        startAnimation()
      }, 1500)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunks.length, showingDocumentFirst])

  // Auto-scroll RIGHT panel to show latest chunk
  useEffect(() => {
    if (rightPanelRef.current && currentChunkIndex >= 0) {
      const panel = rightPanelRef.current
      panel.scrollTop = panel.scrollHeight
    }
  }, [currentChunkIndex])

  // Auto-scroll LEFT panel to follow the active selection
  useEffect(() => {
    if (activeSelectionRef.current && leftPanelRef.current && currentChunkIndex >= 0) {
      const selection = activeSelectionRef.current
      const panel = leftPanelRef.current

      // Calculate position relative to scroll container
      const selectionRect = selection.getBoundingClientRect()
      const panelRect = panel.getBoundingClientRect()

      // Calculate where the selection is relative to the panel's current scroll
      const relativeTop = selectionRect.top - panelRect.top + panel.scrollTop

      // Target scroll position to center the selection in the panel
      const targetScroll = relativeTop - (panelRect.height / 2) + (selectionRect.height / 2)

      panel.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth'
      })
    }
  }, [currentChunkIndex])

  // Progressive speed: starts at 3500ms, accelerates exponentially
  const getAnimationSpeed = (chunkIndex: number) => {
    // Start at 3500ms, decay by 15% each step, minimum 100ms
    const speed = 3500 * Math.pow(0.85, chunkIndex)
    return Math.max(100, speed)
  }

  const startAnimation = () => {
    if (isAnimating || chunks.length === 0) return
    setIsAnimating(true)
    setCurrentChunkIndex(-1)

    let idx = -1

    const animate = () => {
      idx++
      setCurrentChunkIndex(idx)

      if (idx < chunks.length - 1) {
        const speed = getAnimationSpeed(idx)
        animationRef.current = setTimeout(animate, speed)
      } else {
        setIsAnimating(false)
      }
    }

    // First chunk at full slow speed
    animationRef.current = setTimeout(animate, getAnimationSpeed(0))
  }

  const resetAnimation = () => {
    if (animationRef.current) clearTimeout(animationRef.current)
    setCurrentChunkIndex(-1)
    setIsAnimating(false)
    setTimeout(startAnimation, 300)
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current)
    }
  }, [])

  // Get the currently "selected" chunk (being animated)
  const activeChunk = currentChunkIndex >= 0 ? chunks[currentChunkIndex] : null
  const completedChunks = chunks.slice(0, currentChunkIndex + 1)

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('errors.noDocument')}</p>
        <button
          onClick={() => setCurrentStep(0)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          {t('steps.upload.title')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Minimal header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scissors className="w-6 h-6 text-blue-600" />
          <span className="text-lg font-bold">
            {isAnimating
              ? t('steps.chunking.status.chunking', { current: currentChunkIndex + 1, total: chunks.length })
              : currentChunkIndex >= 0
                ? `✓ ${t('steps.chunking.status.complete', { count: chunks.length })}`
                : t('steps.chunking.status.ready')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowControls(!showControls)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            title={t('steps.chunking.settings')}
          >
            <Settings2 className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={resetAnimation}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            {t('nav.reset')}
          </button>
        </div>
      </div>

      {/* Controls (collapsible) */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center gap-6">
              <label className="flex items-center gap-3">
                <span className="text-sm font-medium">{t('steps.chunking.chunkSize')}:</span>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={chunkingConfig.chunkSize}
                  onChange={(e) => setChunkingConfig({ chunkSize: Number(e.target.value) })}
                  className="w-32"
                />
                <span className="text-sm text-gray-600 w-16">{chunkingConfig.chunkSize}</span>
              </label>
              <label className="flex items-center gap-3">
                <span className="text-sm font-medium">{t('steps.chunking.overlap')}:</span>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={chunkingConfig.overlap}
                  onChange={(e) => setChunkingConfig({ overlap: Number(e.target.value) })}
                  className="w-32"
                />
                <span className="text-sm text-gray-600 w-16">{chunkingConfig.overlap}%</span>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Educational Explanation Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full px-4 py-3 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900 dark:text-blue-100">
              {t('steps.chunking.learnMore')}
            </span>
          </div>
          {showExplanation ? (
            <ChevronUp className="w-5 h-5 text-blue-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-blue-600" />
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
                {/* WHY CHUNK */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                    <span className="text-lg">🤔</span> {t('steps.chunking.why.title')}
                  </h4>
                  <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• {t('steps.chunking.why.reason1')}</li>
                    <li>• {t('steps.chunking.why.reason2')}</li>
                    <li>• {t('steps.chunking.why.reason3')}</li>
                  </ul>
                </div>

                {/* HOW IT WORKS */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <h4 className="font-bold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                    <span className="text-lg">⚙️</span> {t('steps.chunking.how.title')}
                  </h4>
                  <ol className="space-y-1 text-gray-700 dark:text-gray-300">
                    <li>{t('steps.chunking.how.step1')}</li>
                    <li>{t('steps.chunking.how.step2', { size: chunkingConfig.chunkSize })}</li>
                    <li>{t('steps.chunking.how.step3')}</li>
                    <li>{t('steps.chunking.how.step4')}</li>
                  </ol>
                </div>

                {/* WHY OVERLAP */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <h4 className="font-bold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-2">
                    <span className="text-lg">🔗</span> {t('steps.chunking.whyOverlap.title')}
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    {t('steps.chunking.whyOverlap.reason')}
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-xs font-mono">
                    <div className="text-red-500">❌ {t('steps.chunking.whyOverlap.bad')}</div>
                    <div className="text-green-600">✓ {t('steps.chunking.whyOverlap.good', { overlap: chunkingConfig.overlap })}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MAIN: Side-by-side view - both panels independently scrollable */}
      <div className="grid grid-cols-2 gap-4">
        {/* LEFT: Original Document with selection highlight */}
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
            📄 {t('steps.chunking.originalDoc')}
            {showingDocumentFirst && (
              <span className="text-xs text-blue-500 animate-pulse">{t('steps.chunking.readingDoc')}</span>
            )}
          </div>
          <div
            ref={leftPanelRef}
            className="h-96 bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-y-auto p-4"
          >
            <SourceDocument
              content={document.content}
              activeChunk={activeChunk}
              completedChunks={completedChunks}
              activeSelectionRef={activeSelectionRef}
            />
          </div>
        </div>

        {/* RIGHT: Chunks appearing */}
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
            ✂️ {t('steps.chunking.chunksLabel', { current: completedChunks.length, total: chunks.length })}
          </div>
          <div
            ref={rightPanelRef}
            className="h-96 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-y-auto p-4"
          >
            <ChunksPanel chunks={completedChunks} activeChunkId={activeChunk?.id} />
          </div>
        </div>
      </div>

      {/* Big Next Step Button */}
      {!isAnimating && currentChunkIndex >= 0 && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setCurrentStep(2)}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
        >
          {t('nav.next')}
          <ArrowRight className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  )
}

// Source document with highlight for current selection
function SourceDocument({
  content,
  activeChunk,
  completedChunks,
  activeSelectionRef
}: {
  content: string
  activeChunk: { id: string; start: number; end: number; color: string } | null
  completedChunks: Array<{ start: number; end: number; color: string; id: string }>
  activeSelectionRef: React.RefObject<HTMLSpanElement | null>
}) {
  const segments = useMemo(() => {
    const result: Array<{
      text: string
      type: 'plain' | 'completed' | 'active'
      color?: string
    }> = []

    // Build a map of all character positions
    const charMap = new Array(content.length).fill(null)

    // Mark completed chunks (dimmed)
    for (const chunk of completedChunks) {
      if (chunk.id !== activeChunk?.id) {
        for (let i = chunk.start; i < chunk.end && i < content.length; i++) {
          charMap[i] = { type: 'completed', color: chunk.color }
        }
      }
    }

    // Mark active chunk (bright selection)
    if (activeChunk) {
      for (let i = activeChunk.start; i < activeChunk.end && i < content.length; i++) {
        charMap[i] = { type: 'active', color: activeChunk.color }
      }
    }

    // Build segments
    let currentType: string | null = null
    let currentColor: string | undefined
    let currentText = ''

    for (let i = 0; i <= content.length; i++) {
      const info = i < content.length ? charMap[i] : null
      const type = info?.type ?? 'plain'
      const color = info?.color

      if (type !== currentType || color !== currentColor) {
        if (currentText) {
          result.push({
            text: currentText,
            type: currentType as 'plain' | 'completed' | 'active',
            color: currentColor,
          })
        }
        currentType = type
        currentColor = color
        currentText = i < content.length ? content[i] : ''
      } else if (i < content.length) {
        currentText += content[i]
      }
    }

    return result
  }, [content, activeChunk, completedChunks])

  return (
    <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
      {segments.map((seg, i) => {
        if (seg.type === 'active') {
          return (
            <motion.span
              key={i}
              ref={activeSelectionRef}
              initial={{ backgroundColor: 'transparent', scale: 1 }}
              animate={{
                backgroundColor: [seg.color + '80', seg.color + '40', seg.color + '80'],
                boxShadow: [
                  `0 0 0 3px ${seg.color}, 0 0 20px ${seg.color}60`,
                  `0 0 0 4px ${seg.color}, 0 0 30px ${seg.color}80`,
                  `0 0 0 3px ${seg.color}, 0 0 20px ${seg.color}60`
                ]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="rounded relative"
              style={{
                borderBottom: `4px solid ${seg.color}`,
                padding: '2px 0',
              }}
            >
              {seg.text}
            </motion.span>
          )
        }
        if (seg.type === 'completed') {
          return (
            <span
              key={i}
              className="opacity-30"
              style={{
                backgroundColor: seg.color + '15',
                borderBottom: `2px solid ${seg.color}30`
              }}
            >
              {seg.text}
            </span>
          )
        }
        return (
          <span key={i} className="text-gray-600 dark:text-gray-400">
            {seg.text}
          </span>
        )
      })}
    </div>
  )
}

// Right panel showing chunks as they appear
function ChunksPanel({
  chunks,
  activeChunkId
}: {
  chunks: Array<{ id: string; text: string; color: string; tokenCount: number }>
  activeChunkId?: string
}) {
  const { t } = useTranslation()

  if (chunks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Scissors className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>{t('steps.chunking.chunksWillAppear')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {chunks.map((chunk, index) => {
          const isActive = chunk.id === activeChunkId

          return (
            <motion.div
              key={chunk.id}
              initial={{
                opacity: 0,
                x: -100,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: isActive ? 1.02 : 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25
              }}
              className="rounded-lg overflow-hidden"
              style={{
                border: `2px solid ${chunk.color}`,
                backgroundColor: isActive ? chunk.color + '20' : 'white',
                boxShadow: isActive ? `0 4px 20px ${chunk.color}40` : 'none'
              }}
            >
              {/* Chunk header */}
              <div
                className="px-3 py-1.5 flex items-center justify-between"
                style={{ backgroundColor: chunk.color }}
              >
                <span className="text-white font-bold text-sm">
                  Chunk {index + 1}
                </span>
                <span className="text-white/80 text-xs">
                  {chunk.text.length} chars · ~{chunk.tokenCount} tokens
                </span>
              </div>
              {/* Chunk content */}
              <div className="p-3 font-mono text-xs leading-relaxed text-gray-700 dark:text-gray-300 max-h-32 overflow-hidden">
                {chunk.text.length > 300
                  ? chunk.text.slice(0, 300) + '...'
                  : chunk.text}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
