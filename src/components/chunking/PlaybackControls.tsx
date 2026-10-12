import { useTranslation } from 'react-i18next'
import { Pause, Play, StepForward, FastForward, RotateCcw, Settings2 } from 'lucide-react'
import { PLAYBACK_SPEEDS } from './chunkingTimeline'
import type { PlaybackSpeed } from './chunkingTimeline'

interface PlaybackControlsProps {
  isPlaying: boolean
  paused: boolean
  speed: PlaybackSpeed
  onTogglePause: () => void
  onNextStep: () => void
  onSpeed: (speed: PlaybackSpeed) => void
  onSkip: () => void
  onReplay: () => void
  onSettings: () => void
}

const BUTTON = 'flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium transition-colors'

export function PlaybackControls(props: PlaybackControlsProps) {
  const { t } = useTranslation()
  const { isPlaying, paused, speed } = props

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isPlaying && (
        <>
          <button onClick={props.onTogglePause} className={`${BUTTON} bg-blue-600 text-white hover:bg-blue-700`}>
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {paused ? t('steps.chunking.anim.play') : t('steps.chunking.anim.pause')}
          </button>
          <button onClick={props.onNextStep} className={`${BUTTON} bg-gray-100 text-gray-800 hover:bg-gray-200`}>
            <StepForward className="w-4 h-4" />
            {t('steps.chunking.anim.nextStep')}
          </button>
          <div className="flex rounded-lg bg-gray-100 p-1" role="group" aria-label={t('steps.chunking.anim.speed')}>
            {PLAYBACK_SPEEDS.map((option) => (
              <button
                key={option}
                onClick={() => props.onSpeed(option)}
                className={`px-3 py-1 rounded-md text-base tabular-nums ${option === speed ? 'bg-white shadow font-semibold text-gray-900' : 'text-gray-500'}`}
              >
                {option}×
              </button>
            ))}
          </div>
          <button onClick={props.onSkip} className={`${BUTTON} text-gray-600 hover:bg-gray-100`}>
            <FastForward className="w-4 h-4" />
            {t('steps.chunking.skip')}
          </button>
        </>
      )}
      {!isPlaying && (
        <button onClick={props.onReplay} className={`${BUTTON} bg-blue-600 text-white hover:bg-blue-700`}>
          <RotateCcw className="w-4 h-4" />
          {t('steps.chunking.anim.replay')}
        </button>
      )}
      <button onClick={props.onSettings} className="p-2 rounded-lg hover:bg-gray-100" title={t('steps.chunking.settings')}>
        <Settings2 className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  )
}
