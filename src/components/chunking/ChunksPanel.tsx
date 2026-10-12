import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Scissors } from 'lucide-react'
import type { Chunk } from '../../types'
import { ChunkCard } from './ChunkCard'

interface ChunksPanelProps {
  placedChunks: Chunk[]
  // Chunk on its way into the list: its slot is reserved but stays invisible
  incomingChunk: Chunk | null
  slotRef: RefObject<HTMLDivElement | null>
}

export function ChunksPanel({ placedChunks, incomingChunk, slotRef }: ChunksPanelProps) {
  const { t } = useTranslation()

  if (placedChunks.length === 0 && !incomingChunk) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Scissors className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-base">{t('steps.chunking.chunksWillAppear')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {placedChunks.map((chunk, index) => {
        const justLanded = index === placedChunks.length - 1
        return (
          <motion.div
            key={chunk.id}
            initial={{ scale: 1 }}
            animate={justLanded ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <ChunkCard chunk={chunk} number={index + 1} />
          </motion.div>
        )
      })}
      {incomingChunk && (
        <div ref={slotRef} className="invisible" aria-hidden="true">
          <ChunkCard chunk={incomingChunk} number={placedChunks.length + 1} />
        </div>
      )}
    </div>
  )
}
