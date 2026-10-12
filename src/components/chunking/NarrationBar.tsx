import { useTranslation } from 'react-i18next'
import { ALGORITHM_PHASES } from './chunkingTimeline'
import type { ChunkPhase } from './chunkingTimeline'

interface NarrationBarProps {
  phase: ChunkPhase
  index: number
  total: number
  windowTokens: number
  chunkSize: number
  overlap: number
  color: string | null
}

const COUNTED_PHASES: ChunkPhase[] = ['window', 'snap', 'cutting']

function useCaption({ phase, index, total, windowTokens, chunkSize, overlap }: NarrationBarProps): string {
  const { t } = useTranslation()
  const number = index + 1
  switch (phase) {
    case 'reading':
      return t('steps.chunking.anim.reading')
    case 'overlap':
      return t('steps.chunking.anim.overlap', { overlap })
    case 'window':
      return t('steps.chunking.anim.window', { tokens: chunkSize })
    case 'snap':
      return t('steps.chunking.anim.snap')
    case 'cutting':
      return t('steps.chunking.anim.cutting', { number, tokens: windowTokens })
    case 'flying':
      return t('steps.chunking.anim.flying', { number })
    case 'done':
      return t('steps.chunking.anim.done', { count: total })
    default:
      return t('steps.chunking.status.ready')
  }
}

// The five steps of the algorithm, the current one lit up
function AlgorithmStrip({ phase, color, chunkSize }: { phase: ChunkPhase; color: string | null; chunkSize: number }) {
  const { t } = useTranslation()
  return (
    <ol className="flex flex-wrap gap-2">
      {ALGORITHM_PHASES.map((step, i) => {
        const isCurrent = step === phase
        return (
          <li
            key={step}
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-base ${
              isCurrent ? 'text-white font-semibold shadow' : 'bg-gray-100 text-gray-500'
            }`}
            style={isCurrent ? { backgroundColor: color ?? '#2563eb' } : undefined}
          >
            <span className="tabular-nums">{i + 1}</span>
            {t(`steps.chunking.anim.strip.${step}`, { tokens: chunkSize })}
          </li>
        )
      })}
    </ol>
  )
}

function TokenCounter({ count, total, color }: { count: number; total: number; color: string }) {
  const { t } = useTranslation()
  return (
    <div className="w-56 shrink-0">
      <div className="text-base font-semibold tabular-nums text-right" style={{ color }}>
        {t('steps.chunking.anim.counter', { count, total })}
      </div>
      <div className="mt-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (count / total) * 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export function NarrationBar(props: NarrationBarProps) {
  const caption = useCaption(props)
  const { phase, color, windowTokens, chunkSize } = props
  const showCounter = COUNTED_PHASES.includes(phase) && color

  return (
    <div className="flex flex-col gap-3">
      <AlgorithmStrip phase={phase} color={color} chunkSize={chunkSize} />
      <div className="flex items-center justify-between gap-6 min-h-16">
        <p className="text-xl font-semibold text-gray-900 leading-snug" aria-live="polite">{caption}</p>
        {showCounter && <TokenCounter count={windowTokens} total={chunkSize} color={color} />}
      </div>
    </div>
  )
}
