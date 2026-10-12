import { useMemo } from 'react'
import type { RefObject } from 'react'
import { motion } from 'framer-motion'
import { Scissors } from 'lucide-react'
import type { Chunk } from '../../types'
import type { ChunkPhase } from './chunkingTimeline'

export interface ActiveRange {
  start: number
  end: number
  color: string
}

type SegmentType = 'plain' | 'placed' | 'active'

interface Segment {
  text: string
  type: SegmentType
  color?: string
}

interface SourceDocumentProps {
  content: string
  placedChunks: Chunk[]
  active: ActiveRange | null
  phase: ChunkPhase
  activeRef: RefObject<HTMLSpanElement | null>
}

// Split the document into runs of plain, already-chunked and active text
function buildSegments(content: string, placedChunks: Chunk[], active: ActiveRange | null): Segment[] {
  const marks: Array<{ type: SegmentType; color?: string }> = new Array(content.length).fill({ type: 'plain' })
  for (const chunk of placedChunks) {
    for (let i = chunk.start; i < chunk.end; i++) marks[i] = { type: 'placed', color: chunk.color }
  }
  if (active) {
    for (let i = active.start; i < active.end; i++) marks[i] = { type: 'active', color: active.color }
  }

  const segments: Segment[] = []
  for (let i = 0; i < content.length; i++) {
    const last = segments.at(-1)
    if (last && last.type === marks[i].type && last.color === marks[i].color) last.text += content[i]
    else segments.push({ text: content[i], ...marks[i] })
  }
  return segments
}

function activeStyle(phase: ChunkPhase, color: string) {
  if (phase === 'flying') {
    // The text has been lifted out: only a faint hole stays behind
    return { backgroundColor: color + '14', opacity: 0.25 }
  }
  if (phase === 'cutting') {
    return { backgroundColor: color + '70', opacity: 1 }
  }
  return { backgroundColor: color + '45', opacity: 1 }
}

function ActiveSegment({ segment, phase, activeRef }: { segment: Segment; phase: ChunkPhase; activeRef: RefObject<HTMLSpanElement | null> }) {
  const color = segment.color ?? '#000000'
  return (
    <>
      <motion.span
        ref={activeRef}
        animate={activeStyle(phase, color)}
        transition={{ duration: 0.25 }}
        className="rounded text-gray-900 dark:text-gray-100"
      >
        {segment.text}
      </motion.span>
      {phase === 'scanning' && (
        <span className="inline-block w-0.5 h-5 align-middle animate-pulse" style={{ backgroundColor: color }} />
      )}
      {phase === 'cutting' && (
        <motion.span
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          className="inline-flex align-middle mx-1 rounded-full p-1 text-white"
          style={{ backgroundColor: color }}
        >
          <Scissors className="w-4 h-4" />
        </motion.span>
      )}
    </>
  )
}

export function SourceDocument({ content, placedChunks, active, phase, activeRef }: SourceDocumentProps) {
  const segments = useMemo(() => buildSegments(content, placedChunks, active), [content, placedChunks, active])

  return (
    // The whole document is on screen at once, the chunking then runs over it
    <div className="font-mono text-base leading-relaxed whitespace-pre-wrap">
      {segments.map((segment, i) => {
        if (segment.type === 'active') {
          return <ActiveSegment key={`active-${i}`} segment={segment} phase={phase} activeRef={activeRef} />
        }
        if (segment.type === 'placed') {
          return (
            <span key={i} className="text-gray-400 dark:text-gray-500" style={{ backgroundColor: segment.color + '18' }}>
              {segment.text}
            </span>
          )
        }
        return (
          <span key={i} className="text-gray-700 dark:text-gray-300">
            {segment.text}
          </span>
        )
      })}
    </div>
  )
}
