import { useTranslation } from 'react-i18next'
import type { Chunk } from '../../types'

// Long chunks are shortened in the list, the full text lives in the document
const PREVIEW_CHARS = 300

export function ChunkCard({ chunk, number }: { chunk: Chunk; number: number }) {
  const { t } = useTranslation()
  const preview = chunk.text.length > PREVIEW_CHARS ? chunk.text.slice(0, PREVIEW_CHARS) + '...' : chunk.text

  return (
    <div className="h-full rounded-lg overflow-hidden bg-white dark:bg-gray-900" style={{ border: `2px solid ${chunk.color}` }}>
      <div className="px-3 py-1.5 flex items-center justify-between gap-2" style={{ backgroundColor: chunk.color }}>
        <span className="text-white font-bold text-base">{t('steps.chunking.chunkNumber', { number })}</span>
        <span className="text-white/90 text-base">
          {t('steps.chunking.chunkStats', { chars: chunk.text.length })} · ~{chunk.tokenCount} tokens
        </span>
      </div>
      <div className="p-3 font-mono text-base leading-relaxed text-gray-700 dark:text-gray-300 line-clamp-4">
        {preview}
      </div>
    </div>
  )
}
