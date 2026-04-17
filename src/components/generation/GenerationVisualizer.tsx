import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Sparkles, ArrowRight, RotateCcw, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useRAGStore } from '../../store/ragStore'
import { useUIStore } from '../../store/uiStore'

export function GenerationVisualizer() {
  const { t } = useTranslation()
  const { query, searchResults } = useRAGStore()
  const { setCurrentStep } = useUIStore()
  const [copied, setCopied] = useState(false)
  const [showExplanation, setShowExplanation] = useState(true)

  // Animation states
  const [currentChunkIndex, setCurrentChunkIndex] = useState(-1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showQuestion, setShowQuestion] = useState(false)
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasStarted = useRef(false)

  // Start animation
  const startAnimation = () => {
    if (isAnimating || searchResults.length === 0) return
    setIsAnimating(true)
    setCurrentChunkIndex(-1)
    setShowQuestion(false)

    let idx = -1
    const speed = 600

    const animateNext = () => {
      idx++
      if (idx < searchResults.length) {
        setCurrentChunkIndex(idx)
        animationRef.current = setTimeout(animateNext, speed)
      } else {
        // Show question at the end
        setTimeout(() => {
          setShowQuestion(true)
          setIsAnimating(false)
        }, 400)
      }
    }

    animationRef.current = setTimeout(animateNext, 300)
  }

  useEffect(() => {
    if (searchResults.length > 0 && !hasStarted.current) {
      hasStarted.current = true
      setTimeout(startAnimation, 500)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults.length])

  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current)
    }
  }, [])

  const resetAnimation = () => {
    if (animationRef.current) clearTimeout(animationRef.current)
    setCurrentChunkIndex(-1)
    setShowQuestion(false)
    setIsAnimating(false)
    setTimeout(startAnimation, 300)
  }

  const handleCopy = async () => {
    const prompt = buildPromptText()
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const buildPromptText = () => {
    const context = searchResults
      .map((r, i) => `[${i + 1}] ${r.chunk.text}`)
      .join('\n\n')
    return `Use the following context to answer the question. Only use information from the context provided.

CONTEXT:
${context}

QUESTION: ${query}

ANSWER:`
  }

  const visibleChunks = searchResults.slice(0, currentChunkIndex + 1)
  const isComplete = !isAnimating && showQuestion

  if (searchResults.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No search results. Perform a search first.</p>
        <button onClick={() => setCurrentStep(3)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          Go to Retrieval
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          <span className="text-lg font-bold">
            {isAnimating
              ? `Adding chunk ${currentChunkIndex + 1}/${searchResults.length} to prompt...`
              : isComplete
                ? '✓ Prompt assembled!'
                : 'Building prompt...'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t('steps.generation.copied') : t('steps.generation.copyPrompt')}
            </button>
          )}
          <button
            onClick={resetAnimation}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Replay
          </button>
        </div>
      </div>

      {/* Educational Explanation Panel */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full px-4 py-3 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-indigo-900 dark:text-indigo-100">
              {t('steps.generation.learnMore')}
            </span>
          </div>
          {showExplanation ? (
            <ChevronUp className="w-5 h-5 text-indigo-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-indigo-600" />
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
                {/* WHAT IS IT */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <h4 className="font-bold text-indigo-700 dark:text-indigo-400 mb-2 flex items-center gap-2">
                    <span className="text-lg">📝</span> WHAT Is Context Assembly?
                  </h4>
                  <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• Combining <strong>retrieved chunks</strong> + your <strong>question</strong></li>
                    <li>• Creating a <strong>structured prompt</strong> for the LLM</li>
                    <li>• The LLM only sees what's in this prompt!</li>
                  </ul>
                </div>

                {/* WHY IT MATTERS */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <h4 className="font-bold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-2">
                    <span className="text-lg">🎯</span> WHY It Matters
                  </h4>
                  <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• LLM answers <strong>only from context</strong> you provide</li>
                    <li>• Reduces <strong>hallucination</strong> (making things up)</li>
                    <li>• Enables <strong>citations</strong> & verifiable answers</li>
                  </ul>
                </div>

                {/* THE MAGIC */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <h4 className="font-bold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                    <span className="text-lg">✨</span> The RAG Magic
                  </h4>
                  <div className="text-gray-700 dark:text-gray-300">
                    <p className="mb-2">Without RAG: LLM guesses from training</p>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-xs font-mono">
                      <div className="text-red-500">❌ "I think the answer is..."</div>
                      <div className="text-green-600">✓ With RAG: "According to [Chunk 2]..."</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MAIN: Side-by-side - Chunks flowing into Prompt */}
      <div className="grid grid-cols-2 gap-4">
        {/* LEFT: Source chunks */}
        <div className="flex flex-col min-h-0">
          <div className="text-sm font-semibold text-gray-500 mb-2">
            📚 Retrieved Chunks ({visibleChunks.length}/{searchResults.length})
          </div>
          <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-auto p-4">
            <div className="space-y-3">
              <AnimatePresence>
                {visibleChunks.map((result, i) => {
                  const isActive = i === currentChunkIndex
                  return (
                    <motion.div
                      key={result.chunk.id}
                      initial={{ opacity: 0, x: -50, scale: 0.9 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: isActive ? 1.02 : 1,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="rounded-lg overflow-hidden"
                      style={{
                        border: `2px solid ${result.chunk.color}`,
                        boxShadow: isActive ? `0 4px 20px ${result.chunk.color}40` : 'none',
                      }}
                    >
                      <div
                        className="px-3 py-1.5 flex items-center justify-between"
                        style={{ backgroundColor: result.chunk.color }}
                      >
                        <span className="text-white font-bold text-sm">Chunk {i + 1}</span>
                        <span className="text-white/80 text-xs">{Math.round(result.similarity * 100)}% match</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                        {result.chunk.text}
                      </div>
                      {/* Arrow showing it goes to prompt */}
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-end px-3 pb-2"
                      >
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </motion.div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* Question appears at end */}
              <AnimatePresence>
                {showQuestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border-2 border-purple-500 overflow-hidden"
                  >
                    <div className="px-3 py-1.5 bg-purple-600">
                      <span className="text-white font-bold text-sm">Your Question</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-900 text-sm font-medium text-purple-700 dark:text-purple-300">
                      "{query}"
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT: Constructed prompt with COLOR-CODED chunks */}
        <div className="flex flex-col min-h-0">
          <div className="text-sm font-semibold text-gray-500 mb-2">
            📝 Final Prompt (color-coded)
          </div>
          <div className="flex-1 bg-gray-900 rounded-xl border-2 border-gray-700 overflow-auto p-4">
            <ColorCodedPrompt
              chunks={visibleChunks}
              query={query}
              showQuestion={showQuestion}
              currentChunkIndex={currentChunkIndex}
            />
          </div>
        </div>
      </div>

      {/* Completion message */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-indigo-50 dark:from-green-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-green-300 dark:border-green-800 p-4"
        >
          <div className="flex items-center gap-4">
            <Sparkles className="w-8 h-8 text-green-600" />
            <div>
              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">RAG Pipeline Complete!</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This prompt can be sent to any LLM. The colors show exactly which chunks will inform the answer.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Color-coded prompt component - shows chunks with their original colors
function ColorCodedPrompt({
  chunks,
  query,
  showQuestion,
  currentChunkIndex,
}: {
  chunks: Array<{ chunk: { id: string; text: string; color: string }; similarity: number }>
  query: string
  showQuestion: boolean
  currentChunkIndex: number
}) {
  return (
    <div className="font-mono text-sm leading-relaxed">
      {/* System instruction */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-gray-400 mb-4"
      >
        Use the following context to answer the question.
        <br />
        Only use information from the context provided.
      </motion.div>

      {/* Context section header */}
      <div className="text-gray-500 mb-2 font-bold">CONTEXT:</div>

      {/* Color-coded chunks */}
      <div className="space-y-3 mb-4">
        <AnimatePresence>
          {chunks.map((result, i) => {
            const isActive = i === currentChunkIndex
            return (
              <motion.div
                key={result.chunk.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                {/* Chunk label */}
                <span
                  className="inline-block px-2 py-0.5 rounded text-xs font-bold text-white mb-1"
                  style={{ backgroundColor: result.chunk.color }}
                >
                  [{i + 1}]
                </span>
                {/* Chunk text with background color */}
                <motion.div
                  className="rounded px-2 py-1 text-gray-100"
                  style={{
                    backgroundColor: result.chunk.color + '30',
                    borderLeft: `3px solid ${result.chunk.color}`,
                  }}
                  animate={{
                    boxShadow: isActive ? `0 0 15px ${result.chunk.color}60` : 'none',
                  }}
                >
                  {result.chunk.text}
                </motion.div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Question section */}
      <AnimatePresence>
        {showQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-gray-500 font-bold">QUESTION:</div>
            <div
              className="rounded px-2 py-1 mt-1 text-purple-300"
              style={{
                backgroundColor: '#9333ea30',
                borderLeft: '3px solid #9333ea',
              }}
            >
              {query}
            </div>

            <div className="text-gray-500 font-bold mt-4">ANSWER:</div>
            <motion.span
              className="inline-block w-2 h-4 bg-green-500 ml-1"
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
