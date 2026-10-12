import { useMemo } from 'react'
import type { CSSProperties, RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Scissors } from 'lucide-react'
import type { Chunk } from '../../types'
import type { ChunkPhase } from './chunkingTimeline'
import type { DocumentView } from './chunkingView'
import { DOCUMENT_TEXT_CLASS } from './documentText'


type MarkType = 'plain' | 'placed' | 'overlap' | 'active' | 'tail'

interface Mark {
  type: MarkType
  color?: string
  // Second color of an overlap: the previous chunk
  color2?: string
}

interface Segment extends Mark {
  text: string
}

interface SourceDocumentProps {
  content: string
  placedChunks: Chunk[]
  view: DocumentView
  chunk: Chunk | null
  previous: Chunk | null
  phase: ChunkPhase
  // The window text, measured for the flight
  activeRef: RefObject<HTMLSpanElement | null>
  // Where the current step starts (overlap or window), followed by the scroll
  focusRef: RefObject<HTMLSpanElement | null>
  // Where the window ends right now (the cut), also kept in view
  edgeRef: RefObject<HTMLSpanElement | null>
}

function paint(marks: Mark[], range: { start: number; end: number } | null, mark: Mark) {
  if (!range) return
  for (let i = range.start; i < range.end; i++) marks[i] = mark
}

function buildSegments(content: string, placedChunks: Chunk[], view: DocumentView, chunk: Chunk | null, previous: Chunk | null): Segment[] {
  const marks: Mark[] = new Array(content.length).fill({ type: 'plain' })
  for (const placed of placedChunks) paint(marks, placed, { type: 'placed', color: placed.color })
  if (chunk) {
    paint(marks, view.active, { type: 'active', color: chunk.color })
    paint(marks, view.overlap, { type: 'overlap', color: chunk.color, color2: previous?.color })
    paint(marks, view.tail, { type: 'tail', color: chunk.color })
  }

  const segments: Segment[] = []
  for (let i = 0; i < content.length; i++) {
    const last = segments.at(-1)
    if (last && last.type === marks[i].type && last.color === marks[i].color) last.text += content[i]
    else segments.push({ text: content[i], ...marks[i] })
  }
  return segments
}

function activeStyle(phase: ChunkPhase, color: string): CSSProperties {
  if (phase === 'flying') return { backgroundColor: color + '12', color: '#9ca3af' }
  if (phase === 'cutting') return { backgroundColor: color + '66', color: '#111827' }
  return { backgroundColor: color + '3d', color: '#111827' }
}

function segmentStyle(segment: Segment, phase: ChunkPhase): CSSProperties {
  const color = segment.color ?? '#000000'
  switch (segment.type) {
    case 'active':
      return activeStyle(phase, color)
    case 'tail':
      // Past the sentence end: the cut gives this text back to the next chunk
      return { backgroundColor: color + '1a', color: '#9ca3af', textDecoration: `line-through ${color}` }
    case 'overlap': {
      // Belongs to both chunks: clear stripes in both colors
      const previous = segment.color2 ?? color
      return {
        backgroundImage: `repeating-linear-gradient(135deg, ${previous}99 0 6px, transparent 6px 9px, ${color}99 9px 15px, transparent 15px 18px)`,
        color: '#111827',
        fontWeight: 600,
      }
    }
    case 'placed':
      return { backgroundColor: color + '14', color: '#9ca3af' }
    default:
      return { color: '#374151' }
  }
}

function Marker({ phase, color }: { phase: ChunkPhase; color: string }) {
  if (phase === 'window') {
    return <span className="inline-block w-[3px] h-6 align-middle animate-pulse rounded" style={{ backgroundColor: color }} />
  }
  if (phase === 'cutting') {
    return (
      <span className="inline-flex align-middle mx-1 rounded-full p-1.5 text-white shadow" style={{ backgroundColor: color }}>
        <Scissors className="w-5 h-5" />
      </span>
    )
  }
  return null
}

function lastIndexWhere<T>(items: T[], matches: (item: T) => boolean): number {
  for (let i = items.length - 1; i >= 0; i--) if (matches(items[i])) return i
  return -1
}

function OverlapBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex align-middle mr-1 rounded-full bg-gray-900 px-2 text-base leading-7 text-white font-sans">{label}</span>
  )
}

export function SourceDocument({ content, placedChunks, view, chunk, previous, phase, activeRef, focusRef, edgeRef }: SourceDocumentProps) {
  const { t } = useTranslation()
  const segments = useMemo(
    () => buildSegments(content, placedChunks, view, chunk, previous),
    [content, placedChunks, view, chunk, previous],
  )
  const focusIndex = segments.findIndex((segment) => segment.type === 'overlap' || segment.type === 'active')
  const edgeIndex = lastIndexWhere(segments, (segment) => segment.type === 'active' || segment.type === 'tail')

  // The whole document is on screen at once, the chunking then runs over it
  return (
    <div className={DOCUMENT_TEXT_CLASS}>
      {segments.map((segment, i) => (
        <span key={i} ref={i === focusIndex ? focusRef : undefined}>
          {segment.type === 'overlap' && phase === 'overlap' && <OverlapBadge label={t('steps.chunking.anim.overlapBadge')} />}
          <span
            ref={segment.type === 'active' ? activeRef : undefined}
            className="rounded-sm"
            style={segmentStyle(segment, phase)}
          >
            {segment.text}
          </span>
          {segment.type === 'active' && <Marker phase={phase} color={segment.color ?? '#000000'} />}
          {i === edgeIndex && <span ref={edgeRef} />}
        </span>
      ))}
    </div>
  )
}
