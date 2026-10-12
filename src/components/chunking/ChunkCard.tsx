import { useTranslation } from 'react-i18next'
import type { Chunk } from '../../types'

export function ChunkCard({ chunk, number }: { chunk: Chunk; number: number }) {
  const { t } = useTranslation()

  return (
    <div className="h-full flex rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-200">
      <div className="w-2 shrink-0" style={{ backgroundColor: chunk.color }} />
      <div className="flex-1 min-w-0 px-4 py-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-bold text-base" style={{ color: chunk.color }}>
            {t('steps.chunking.chunkNumber', { number })}
          </span>
          <span className="text-base text-gray-500 tabular-nums">~{chunk.tokenCount} tokens</span>
        </div>
        <p className="font-serif text-base leading-7 text-gray-700 line-clamp-3">{chunk.text}</p>
      </div>
    </div>
  )
}
