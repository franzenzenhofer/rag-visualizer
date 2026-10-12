import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useRAGStore } from '../../store/ragStore'

export function ChunkingControls({ open }: { open: boolean }) {
  const { t } = useTranslation()
  const { chunkingConfig, setChunkingConfig } = useRAGStore()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center gap-6">
            <label className="flex items-center gap-3">
              <span className="text-base font-medium">{t('steps.chunking.chunkSize')}:</span>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={chunkingConfig.chunkSize}
                onChange={(e) => setChunkingConfig({ chunkSize: Number(e.target.value) })}
                className="w-32"
              />
              <span className="text-base text-gray-600 w-16">{chunkingConfig.chunkSize}</span>
            </label>
            <label className="flex items-center gap-3">
              <span className="text-base font-medium">{t('steps.chunking.overlap')}:</span>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={chunkingConfig.overlap}
                onChange={(e) => setChunkingConfig({ overlap: Number(e.target.value) })}
                className="w-32"
              />
              <span className="text-base text-gray-600 w-16">{chunkingConfig.overlap}%</span>
            </label>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
