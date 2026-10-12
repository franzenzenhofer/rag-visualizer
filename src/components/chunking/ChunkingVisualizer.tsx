import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { Scissors, Settings2, RotateCcw, ArrowRight, FastForward } from 'lucide-react'
import { useRAGStore } from '../../store/ragStore'
import { useUIStore } from '../../store/uiStore'
import { chunkDocument } from '../../rag/chunker'
import type { Chunk } from '../../types'
import type { ChunkPhase } from './chunkingTimeline'
import { useChunkingAnimation } from './useChunkingAnimation'
import type { ChunkAnimationState } from './useChunkingAnimation'
import { SourceDocument } from './SourceDocument'
import type { ActiveRange } from './SourceDocument'
import { ChunksPanel } from './ChunksPanel'
import { FlyingChunk } from './FlyingChunk'
import { ChunkingControls } from './ChunkingControls'
import { ChunkingExplanation } from './ChunkingExplanation'
import { measureFlightFromDom } from './flightGeometry'

const CHUNK_PHASES: ChunkPhase[] = ['scanning', 'cutting', 'flying']

// The sweep starts a quarter down the document panel, so the whole chunk fits below it
const SCROLL_ANCHOR_SHARE = 0.25

function useStatusText(state: ChunkAnimationState, total: number, tokens: number): string {
  const { t } = useTranslation()
  const current = state.index + 1
  switch (state.phase) {
    case 'reading':
      return t('steps.chunking.status.reading')
    case 'scanning':
      return t('steps.chunking.status.scanning', { current, total, tokens })
    case 'cutting':
      return t('steps.chunking.status.cutting', { current, total })
    case 'flying':
      return t('steps.chunking.status.moving', { current, total })
    case 'done':
      return `✓ ${t('steps.chunking.status.complete', { count: total })}`
    default:
      return t('steps.chunking.status.ready')
  }
}

function toActiveRange(chunk: Chunk | null, state: ChunkAnimationState): ActiveRange | null {
  if (!chunk) return null
  const end = state.phase === 'scanning' ? state.scanEnd : chunk.end
  return { start: chunk.start, end, color: chunk.color }
}

export function ChunkingVisualizer() {
  const { t } = useTranslation()
  const { document, chunks, setChunks, chunkingConfig } = useRAGStore()
  const { setCurrentStep } = useUIStore()
  const reducedMotion = useReducedMotion() ?? false
  const [showControls, setShowControls] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLSpanElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)

  // Rechunk when the document or the settings change
  useEffect(() => {
    if (document) setChunks(chunkDocument(document.content, chunkingConfig))
  }, [document, chunkingConfig, setChunks])

  // Bring the empty slot into view, then measure where the text flies from and to
  const measureFlight = useCallback(() => {
    const left = leftPanelRef.current
    const right = rightPanelRef.current
    const selection = activeRef.current
    const slot = slotRef.current
    if (!left || !right || !selection || !slot) {
      console.error('[chunking] cannot measure flight', { left: !!left, right: !!right, selection: !!selection, slot: !!slot })
      return null
    }
    right.scrollTop = right.scrollHeight
    return measureFlightFromDom(left, selection, slot)
  }, [])

  const { state, replay, skip } = useChunkingAnimation(chunks, document?.content ?? '', reducedMotion, measureFlight)
  const statusText = useStatusText(state, chunks.length, chunkingConfig.chunkSize)

  const activeChunk = CHUNK_PHASES.includes(state.phase) ? chunks[state.index] ?? null : null
  const incomingChunk = state.phase === 'cutting' || state.phase === 'flying' ? activeChunk : null
  const placedChunks = useMemo(() => chunks.slice(0, state.placedCount), [chunks, state.placedCount])
  const active = useMemo(() => toActiveRange(activeChunk, state), [activeChunk, state])
  const isPlaying = state.phase !== 'idle' && state.phase !== 'done'

  // Make sure the document and the chunk list are on screen when the story starts
  useEffect(() => {
    if (state.phase === 'reading') stageRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [state.phase])

  // Follow the sweep: put the start of each new chunk near the top of the document panel
  const scanningIndex = state.phase === 'scanning' ? state.index : -1
  useEffect(() => {
    const panel = leftPanelRef.current
    const selection = activeRef.current
    if (scanningIndex < 0 || !panel || !selection) return
    const offset = selection.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop
    panel.scrollTo({ top: Math.max(0, offset - panel.clientHeight * SCROLL_ANCHOR_SHARE), behavior: 'smooth' })
  }, [scanningIndex])

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('errors.noDocument')}</p>
        <button onClick={() => setCurrentStep(1)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          {t('steps.upload.title')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Scissors className="w-6 h-6 text-blue-600 shrink-0" />
          <span className="text-lg font-bold" aria-live="polite">{statusText}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowControls(!showControls)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            title={t('steps.chunking.settings')}
          >
            <Settings2 className="w-5 h-5 text-gray-600" />
          </button>
          {isPlaying ? (
            <button
              onClick={skip}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-200 text-base font-medium"
            >
              <FastForward className="w-4 h-4" />
              {t('steps.chunking.skip')}
            </button>
          ) : (
            <button
              onClick={replay}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              {t('nav.reset')}
            </button>
          )}
        </div>
      </div>

      <ChunkingControls open={showControls} />
      <ChunkingExplanation />

      <div ref={stageRef} className="grid grid-cols-2 gap-4 scroll-mt-24">
        <div className="flex flex-col">
          <div className="text-base font-semibold text-gray-500 mb-2 flex items-center gap-2">
            📄 {t('steps.chunking.originalDoc')}
            {state.phase === 'reading' && (
              <span className="text-base text-blue-500 animate-pulse">{t('steps.chunking.readingDoc')}</span>
            )}
          </div>
          <div
            ref={leftPanelRef}
            className="h-96 bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-y-auto p-4"
          >
            <SourceDocument
              content={document.content}
              placedChunks={placedChunks}
              active={active}
              phase={state.phase}
              activeRef={activeRef}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="text-base font-semibold text-gray-500 mb-2 flex items-center gap-2">
            ✂️ {t('steps.chunking.chunksLabel', { current: placedChunks.length, total: chunks.length })}
          </div>
          <div
            ref={rightPanelRef}
            className="h-96 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-y-auto p-4"
          >
            <ChunksPanel placedChunks={placedChunks} incomingChunk={incomingChunk} slotRef={slotRef} />
          </div>
        </div>
      </div>

      {state.phase === 'flying' && state.flight && activeChunk && (
        <FlyingChunk
          key={activeChunk.id}
          chunk={activeChunk}
          sourceText={document.content.slice(activeChunk.start, activeChunk.end)}
          number={state.index + 1}
          flight={state.flight}
          durationMs={state.phaseMs}
        />
      )}

      {state.phase === 'done' && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setCurrentStep(3)}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
        >
          {t('nav.next')}
          <ArrowRight className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  )
}
