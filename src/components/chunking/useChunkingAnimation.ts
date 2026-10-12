import { useCallback, useEffect, useRef, useState } from 'react'
import type { Chunk } from '../../types'
import { READING_MS, easeInOut, phaseDurations, snapToWordEnd } from './chunkingTimeline'
import type { ChunkPhase } from './chunkingTimeline'
import type { Flight } from './flightGeometry'

export interface ChunkAnimationState {
  phase: ChunkPhase
  // Chunk currently being selected, cut or moved (-1 while reading)
  index: number
  // End of the sweep highlight inside the document
  scanEnd: number
  // Chunks already landed in the chunk list
  placedCount: number
  // Duration of the current phase, shared with the flying ghost
  phaseMs: number
  flight: Flight | null
}

const IDLE: ChunkAnimationState = { phase: 'idle', index: -1, scanEnd: 0, placedCount: 0, phaseMs: 0, flight: null }

type SetState = (update: (state: ChunkAnimationState) => ChunkAnimationState) => void
type IsAlive = () => boolean

interface TimelineContext {
  chunks: Chunk[]
  text: string
  reducedMotion: boolean
  set: SetState
  isAlive: IsAlive
  measureFlight: () => Flight | null
}

function doneState(chunkCount: number): ChunkAnimationState {
  return { ...IDLE, phase: 'done', index: chunkCount - 1, placedCount: chunkCount }
}

function wait(ms: number, isAlive: IsAlive): Promise<boolean> {
  return new Promise((resolve) => setTimeout(() => resolve(isAlive()), ms))
}

// Sweep the highlight from chunk start to end, one animation frame at a time
function sweep(ctx: TimelineContext, chunk: Chunk, durationMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const startedAt = performance.now()
    const frame = (now: number) => {
      if (!ctx.isAlive()) return resolve(false)
      const progress = durationMs > 0 ? Math.min(1, (now - startedAt) / durationMs) : 1
      const raw = chunk.start + Math.round((chunk.end - chunk.start) * easeInOut(progress))
      const scanEnd = snapToWordEnd(ctx.text, raw, chunk.end)
      ctx.set((state) => ({ ...state, scanEnd }))
      if (progress < 1) requestAnimationFrame(frame)
      else resolve(true)
    }
    requestAnimationFrame(frame)
  })
}

async function playChunk(ctx: TimelineContext, index: number): Promise<boolean> {
  const chunk = ctx.chunks[index]
  const ms = phaseDurations(index, ctx.reducedMotion)
  console.debug(`[chunking] chunk ${index + 1}/${ctx.chunks.length} scan ${ms.scan}ms cut ${ms.cut}ms fly ${ms.fly}ms reducedMotion=${ctx.reducedMotion}`)

  ctx.set(() => ({ ...IDLE, phase: 'scanning', index, scanEnd: chunk.start, placedCount: index, phaseMs: ms.scan }))
  if (!(await sweep(ctx, chunk, ms.scan))) return false

  ctx.set((state) => ({ ...state, phase: 'cutting', scanEnd: chunk.end, phaseMs: ms.cut }))
  if (!(await wait(ms.cut, ctx.isAlive))) return false

  // The empty slot for this chunk is rendered during cutting, so it can be measured now
  const flight = ms.fly > 0 ? ctx.measureFlight() : null
  ctx.set((state) => ({ ...state, phase: 'flying', phaseMs: ms.fly, flight }))
  return wait(ms.fly, ctx.isAlive)
}

async function runTimeline(ctx: TimelineContext): Promise<void> {
  if (!(await wait(0, ctx.isAlive))) return
  ctx.set(() => ({ ...IDLE, phase: 'reading', phaseMs: READING_MS }))
  if (!(await wait(READING_MS, ctx.isAlive))) return

  for (let index = 0; index < ctx.chunks.length; index++) {
    if (!(await playChunk(ctx, index))) return
  }
  ctx.set(() => doneState(ctx.chunks.length))
}

export function useChunkingAnimation(
  chunks: Chunk[],
  text: string,
  reducedMotion: boolean,
  measureFlight: () => Flight | null,
) {
  const [state, setState] = useState<ChunkAnimationState>(IDLE)
  const runIdRef = useRef(0)
  const measureRef = useRef(measureFlight)

  useEffect(() => {
    measureRef.current = measureFlight
  }, [measureFlight])

  // Starts a fresh run (any older run stops itself) and returns its cancel function
  const play = useCallback(() => {
    const runId = ++runIdRef.current
    let cancelled = false
    if (chunks.length > 0) {
      void runTimeline({
        chunks,
        text,
        reducedMotion,
        set: setState,
        isAlive: () => !cancelled && runIdRef.current === runId,
        measureFlight: () => measureRef.current(),
      })
    }
    return () => {
      cancelled = true
    }
  }, [chunks, text, reducedMotion])

  const skip = useCallback(() => {
    runIdRef.current++
    setState(doneState(chunks.length))
  }, [chunks.length])

  // Restart whenever the chunks change (new document or new settings)
  useEffect(() => play(), [play])

  const replay = useCallback(() => {
    play()
  }, [play])

  return { state, replay, skip }
}
