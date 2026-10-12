import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import type { Chunk } from '../../types'
import { ChunkCard } from './ChunkCard'
import type { Flight } from './flightGeometry'

interface FlyingChunkProps {
  chunk: Chunk
  // The exact document text of the chunk, so the copy wraps like the source
  sourceText: string
  number: number
  flight: Flight
  durationMs: number
}

// The highlighted text lifts out of the document and morphs into its chunk card
export function FlyingChunk({ chunk, sourceText, number, flight, durationMs }: FlyingChunkProps) {
  const seconds = durationMs / 1000

  return createPortal(
    <motion.div
      className="fixed z-50 pointer-events-none overflow-hidden rounded-lg"
      initial={{ ...flight.from, boxShadow: `0 0 0 0px ${chunk.color}00` }}
      animate={{ ...flight.to, boxShadow: `0 16px 40px ${chunk.color}66` }}
      transition={{ duration: seconds, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div
        className="absolute left-0 font-mono text-base leading-relaxed whitespace-pre-wrap text-gray-900"
        style={{ top: flight.textTop, width: flight.textWidth, textIndent: flight.textIndent }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: seconds * 0.25, delay: seconds * 0.2 }}
      >
        <span style={{ backgroundColor: chunk.color + '70' }}>{sourceText}</span>
      </motion.div>
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: seconds * 0.3, delay: seconds * 0.45 }}
      >
        <ChunkCard chunk={chunk} number={number} />
      </motion.div>
    </motion.div>,
    window.document.body,
  )
}
