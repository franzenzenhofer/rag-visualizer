import { createPortal } from 'react-dom'
import type { Chunk } from '../../types'
import { ChunkCard } from './ChunkCard'
import { easeInOut } from './chunkingTimeline'
import type { Box, Flight } from './flightGeometry'
import { DOCUMENT_TEXT_CLASS } from './documentText'

interface FlyingChunkProps {
  chunk: Chunk
  // The exact document text of the chunk, so the copy wraps like the source
  sourceText: string
  number: number
  flight: Flight
  // 0..1, driven by the playback clock so pause and speed apply mid-flight
  progress: number
}

const lerp = (from: number, to: number, t: number) => from + (to - from) * t

function boxAt(from: Box, to: Box, t: number): Box {
  return {
    left: lerp(from.left, to.left, t),
    top: lerp(from.top, to.top, t),
    width: lerp(from.width, to.width, t),
    height: lerp(from.height, to.height, t),
  }
}

// Opacity that fades over the window [start, start + length] of the flight
const fade = (progress: number, start: number, length: number) => Math.min(1, Math.max(0, (progress - start) / length))

// The highlighted text lifts out of the document and turns into its chunk card
export function FlyingChunk({ chunk, sourceText, number, flight, progress }: FlyingChunkProps) {
  const t = easeInOut(progress)
  const cardOpacity = fade(progress, 0.45, 0.3)

  return createPortal(
    <div
      className="fixed z-50 pointer-events-none overflow-hidden rounded-xl"
      style={{ ...boxAt(flight.from, flight.to, t), boxShadow: `0 ${16 * t}px ${40 * t}px ${chunk.color}55` }}
    >
      <div
        className={`absolute left-0 text-gray-900 ${DOCUMENT_TEXT_CLASS}`}
        style={{ top: flight.textTop, width: flight.textWidth, textIndent: flight.textIndent, opacity: 1 - fade(progress, 0.2, 0.3) }}
      >
        <span style={{ backgroundColor: chunk.color + '66' }}>{sourceText}</span>
      </div>
      <div className="absolute inset-0" style={{ opacity: cardOpacity }}>
        <ChunkCard chunk={chunk} number={number} />
      </div>
    </div>,
    window.document.body,
  )
}
