import { useCallback, useEffect, useRef, useState } from 'react'
import type { Chunk } from '../../types'
import { READING_MS, REDUCED_MOTION_READING_MS, phaseDurations } from './chunkingTimeline'
import type { ChunkPhase, PlaybackSpeed } from './chunkingTimeline'
import { hasVisibleSnap } from './chunkingView'
import type { Flight } from './flightGeometry'
import { PlaybackClock } from './playbackClock'

export interface ChunkAnimationState {
  phase: ChunkPhase
  // Chunk currently being worked on (-1 while reading)
  index: number
  // Chunks already stored in the chunk list
  placedCount: number
  // 0..1 inside the current phase
  progress: number
  flight: Flight | null
}

const IDLE: ChunkAnimationState = { phase: 'idle', index: -1, placedCount: 0, progress: 0, flight: null }

interface TimelineContext {
  chunks: Chunk[]
  textLength: number
  windowChars: number
  reducedMotion: boolean
  clock: PlaybackClock
  set: (update: (state: ChunkAnimationState) => ChunkAnimationState) => void
  measureFlight: () => Flight | null
}

function doneState(chunkCount: number): ChunkAnimationState {
  return { ...IDLE, phase: 'done', index: chunkCount - 1, placedCount: chunkCount, progress: 1 }
}

function runPhase(ctx: TimelineContext, next: Omit<ChunkAnimationState, 'progress'>, ms: number): Promise<boolean> {
  ctx.set(() => ({ ...next, progress: 0 }))
  return ctx.clock.wait(ms, (progress) => ctx.set((state) => ({ ...state, progress })))
}

async function playChunk(ctx: TimelineContext, index: number): Promise<boolean> {
  const chunk = ctx.chunks[index]
  const previous = ctx.chunks[index - 1]
  const ms = phaseDurations(index, ctx.reducedMotion)
  const base = { index, placedCount: index, flight: null }
  console.debug(`[chunking] chunk ${index + 1}/${ctx.chunks.length}`, ms)

  if (previous && chunk.start < previous.end) {
    if (!(await runPhase(ctx, { ...base, phase: 'overlap' }, ms.overlap))) return false
  }
  if (!(await runPhase(ctx, { ...base, phase: 'window' }, ms.window))) return false
  if (hasVisibleSnap(chunk, ctx.windowChars, ctx.textLength)) {
    if (!(await runPhase(ctx, { ...base, phase: 'snap' }, ms.snap))) return false
  }
  if (!(await runPhase(ctx, { ...base, phase: 'cutting' }, ms.cutting))) return false

  // The empty slot for this chunk is rendered during cutting, so it can be measured now
  const flight = ms.flying > 0 ? ctx.measureFlight() : null
  return runPhase(ctx, { ...base, phase: 'flying', flight }, ms.flying)
}

async function runTimeline(ctx: TimelineContext): Promise<boolean> {
  const readingMs = ctx.reducedMotion ? REDUCED_MOTION_READING_MS : READING_MS
  if (!(await ctx.clock.wait(0))) return false
  if (!(await runPhase(ctx, { ...IDLE, phase: 'reading' }, readingMs))) return false
  for (let index = 0; index < ctx.chunks.length; index++) {
    if (!(await playChunk(ctx, index))) return false
  }
  ctx.set(() => doneState(ctx.chunks.length))
  return true
}

// Drive the active clock from animation frames
function useFrameLoop(clockRef: { current: PlaybackClock | null }) {
  useEffect(() => {
    let last = performance.now()
    let frameId = requestAnimationFrame(function frame(now) {
      clockRef.current?.tick(now - last)
      last = now
      frameId = requestAnimationFrame(frame)
    })
    return () => cancelAnimationFrame(frameId)
  }, [clockRef])
}

export function useChunkingAnimation(
  chunks: Chunk[],
  textLength: number,
  windowChars: number,
  reducedMotion: boolean,
  measureFlight: () => Flight | null,
) {
  const [state, setState] = useState<ChunkAnimationState>(IDLE)
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1)
  const [paused, setPaused] = useState(false)
  const clockRef = useRef<PlaybackClock | null>(null)
  const speedRef = useRef<PlaybackSpeed>(1)
  const measureRef = useRef(measureFlight)
  useFrameLoop(clockRef)

  useEffect(() => {
    measureRef.current = measureFlight
  }, [measureFlight])

  // Starts a fresh run on a new clock and returns its cancel function
  const play = useCallback(() => {
    clockRef.current?.cancel()
    const clock = new PlaybackClock()
    clock.speed = speedRef.current
    clockRef.current = clock
    if (chunks.length > 0) {
      void runTimeline({
        chunks, textLength, windowChars, reducedMotion, clock,
        set: setState,
        measureFlight: () => measureRef.current(),
      })
    }
    return () => clock.cancel()
  }, [chunks, textLength, windowChars, reducedMotion])

  // Restart whenever the chunks change (new document or new settings)
  useEffect(() => play(), [play])

  const replay = useCallback(() => {
    setPaused(false)
    play()
  }, [play])

  const skip = useCallback(() => {
    clockRef.current?.cancel()
    setPaused(false)
    setState(doneState(chunks.length))
  }, [chunks.length])

  const togglePause = useCallback(() => {
    const clock = clockRef.current
    if (!clock) return
    clock.paused = !clock.paused
    setPaused(clock.paused)
  }, [])

  const nextStep = useCallback(() => clockRef.current?.skipPhase(), [])

  const setSpeed = useCallback((next: PlaybackSpeed) => {
    speedRef.current = next
    setSpeedState(next)
    if (clockRef.current) clockRef.current.speed = next
  }, [])

  return { state, speed, paused, replay, skip, togglePause, nextStep, setSpeed }
}
