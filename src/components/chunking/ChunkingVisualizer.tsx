import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRAGStore } from '../../store/ragStore'
import { useUIStore } from '../../store/uiStore'
import { chunkDocument, estimateCharacters } from '../../rag/chunker'
import type { Chunk } from '../../types'
import type { ChunkPhase } from './chunkingTimeline'
import { documentView } from './chunkingView'
import { useChunkingAnimation } from './useChunkingAnimation'
import { measureFlightFromDom } from './flightGeometry'
import { SourceDocument } from './SourceDocument'
import { ChunksPanel } from './ChunksPanel'
import { FlyingChunk } from './FlyingChunk'
import { NarrationBar } from './NarrationBar'
import { PlaybackControls } from './PlaybackControls'
import { ChunkingControls } from './ChunkingControls'
import { ChunkingExplanation } from './ChunkingExplanation'

const CHUNK_PHASES: ChunkPhase[] = ['overlap', 'window', 'snap', 'cutting', 'flying']

// Each new window starts a fifth down the document panel, so the whole chunk fits below it
const SCROLL_ANCHOR_SHARE = 0.2

// Both panels fit on screen with the narration: below the sticky bars, above the floating nav
const PANEL_HEIGHT = 'h-[clamp(14rem,calc(100dvh-30rem),28rem)]'
// The app scrolls these panels itself: browser scroll anchoring would jump when the marks change
const PANEL = `${PANEL_HEIGHT} rounded-xl border-2 border-gray-200 overflow-y-auto [overflow-anchor:none] p-5`

// Keep the current step in view: re-run for every chunk and every step (overlap, then window)
function useFollowStep(panelRef: { current: HTMLDivElement | null }, focusRef: { current: HTMLSpanElement | null }, followKey: string | null) {
  useEffect(() => {
    const panel = panelRef.current
    const selection = focusRef.current
    if (!followKey || !panel || !selection) return
    const offset = selection.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop
    panel.scrollTo({ top: Math.max(0, offset - panel.clientHeight * SCROLL_ANCHOR_SHARE), behavior: 'smooth' })
  }, [panelRef, focusRef, followKey])
}

// Space kept between the cut and the bottom edge of the document panel
const EDGE_MARGIN_PX = 48

// While the window grows and the cut moves, keep the end of the window in view
function useKeepEdgeVisible(panelRef: { current: HTMLDivElement | null }, edgeRef: { current: HTMLSpanElement | null }, activeEnd: number | null, tailEnd: number | null) {
  useEffect(() => {
    const panel = panelRef.current
    const edge = edgeRef.current
    if (activeEnd === null || !panel || !edge) return
    // Absolute target from the edge's position in the content: repeated calls never add up
    const edgeInContent = edge.getBoundingClientRect().bottom - panel.getBoundingClientRect().top + panel.scrollTop
    const target = edgeInContent - panel.clientHeight + EDGE_MARGIN_PX
    if (target > panel.scrollTop) panel.scrollTo({ top: target, behavior: 'smooth' })
  }, [panelRef, edgeRef, activeEnd, tailEnd])
}

export function ChunkingVisualizer() {
  const { t } = useTranslation()
  const { document, chunks, setChunks, chunkingConfig } = useRAGStore()
  const { setCurrentStep } = useUIStore()
  const reducedMotion = useReducedMotion() ?? false
  const [showSettings, setShowSettings] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLSpanElement>(null)
  const focusRef = useRef<HTMLSpanElement>(null)
  const edgeRef = useRef<HTMLSpanElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const text = document?.content ?? ''
  const windowChars = estimateCharacters(chunkingConfig.chunkSize)

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

  const animation = useChunkingAnimation(chunks, text.length, windowChars, reducedMotion, measureFlight)
  const { state } = animation
  const isPlaying = state.phase !== 'idle' && state.phase !== 'done'
  const chunk: Chunk | null = CHUNK_PHASES.includes(state.phase) ? chunks[state.index] ?? null : null
  const previous = chunk ? chunks[state.index - 1] ?? null : null
  const incomingChunk = state.phase === 'cutting' || state.phase === 'flying' ? chunk : null
  const placedChunks = useMemo(() => chunks.slice(0, state.placedCount), [chunks, state.placedCount])
  const view = useMemo(
    () => documentView({ phase: state.phase, progress: state.progress, chunk, previous, text, windowChars }),
    [state.phase, state.progress, chunk, previous, text, windowChars],
  )

  // Scroll the page to the animation before the story starts
  useEffect(() => {
    if (state.phase === 'reading') stageRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [state.phase])

  const followKey = state.phase === 'window' || state.phase === 'overlap' ? `${state.index}-${state.phase}` : null
  useFollowStep(leftPanelRef, focusRef, followKey)
  useKeepEdgeVisible(leftPanelRef, edgeRef, view.active?.end ?? null, view.tail?.end ?? null)

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

  const progressLabel = state.index >= 0 && isPlaying
    ? t('steps.chunking.anim.chunkOf', { current: state.index + 1, total: chunks.length })
    : t('steps.chunking.description')

  return (
    <div className="flex flex-col gap-6 pb-8">
      <section ref={stageRef} className="scroll-mt-36 rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('steps.chunking.title')}</h2>
            <p className="text-base text-gray-500 tabular-nums">{progressLabel}</p>
          </div>
          <PlaybackControls
            isPlaying={isPlaying}
            paused={animation.paused}
            speed={animation.speed}
            onTogglePause={animation.togglePause}
            onNextStep={animation.nextStep}
            onSpeed={animation.setSpeed}
            onSkip={animation.skip}
            onReplay={animation.replay}
            onSettings={() => setShowSettings(!showSettings)}
          />
        </div>

        <ChunkingControls open={showSettings} />

        <NarrationBar
          phase={state.phase}
          index={state.index}
          total={chunks.length}
          windowTokens={view.windowTokens}
          chunkSize={chunkingConfig.chunkSize}
          overlap={chunkingConfig.overlap}
          color={chunk?.color ?? null}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col min-w-0">
            <div className="text-base font-semibold text-gray-500 mb-2">{t('steps.chunking.originalDoc')}</div>
            <div ref={leftPanelRef} className={`${PANEL} bg-white`}>
              <SourceDocument
                content={text}
                placedChunks={placedChunks}
                view={view}
                chunk={chunk}
                previous={previous}
                phase={state.phase}
                activeRef={activeRef}
                focusRef={focusRef}
                edgeRef={edgeRef}
              />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="text-base font-semibold text-gray-500 mb-2 tabular-nums">
              {t('steps.chunking.chunksLabel', { current: placedChunks.length, total: chunks.length })}
            </div>
            <div ref={rightPanelRef} className={`${PANEL} bg-gray-50`}>
              <ChunksPanel placedChunks={placedChunks} incomingChunk={incomingChunk} slotRef={slotRef} />
            </div>
          </div>
        </div>
      </section>

      {state.phase === 'flying' && state.flight && chunk && (
        <FlyingChunk
          key={chunk.id}
          chunk={chunk}
          sourceText={text.slice(chunk.start, chunk.end)}
          number={state.index + 1}
          flight={state.flight}
          progress={state.progress}
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

      <ChunkingExplanation />
    </div>
  )
}
