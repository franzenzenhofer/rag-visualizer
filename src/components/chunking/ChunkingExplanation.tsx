import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useRAGStore } from '../../store/ragStore'

export function ChunkingExplanation() {
  const { t } = useTranslation()
  const { chunkingConfig } = useRAGStore()
  const [showExplanation, setShowExplanation] = useState(true)

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
      <button
        onClick={() => setShowExplanation(!showExplanation)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-900 dark:text-blue-100">
            {t('steps.chunking.learnMore')}
          </span>
        </div>
        {showExplanation ? (
          <ChevronUp className="w-5 h-5 text-blue-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-blue-600" />
        )}
      </button>
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-base">
              {/* WHY CHUNK */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                  <span className="text-lg">🤔</span> {t('steps.chunking.why.title')}
                </h4>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• {t('steps.chunking.why.reason1')}</li>
                  <li>• {t('steps.chunking.why.reason2')}</li>
                  <li>• {t('steps.chunking.why.reason3')}</li>
                </ul>
              </div>

              {/* HOW IT WORKS */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <h4 className="font-bold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                  <span className="text-lg">⚙️</span> {t('steps.chunking.how.title')}
                </h4>
                <ol className="space-y-1 text-gray-700 dark:text-gray-300">
                  <li>{t('steps.chunking.how.step1')}</li>
                  <li>{t('steps.chunking.how.step2', { size: chunkingConfig.chunkSize })}</li>
                  <li>{t('steps.chunking.how.step3')}</li>
                  <li>{t('steps.chunking.how.step4')}</li>
                </ol>
              </div>

              {/* WHY OVERLAP */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <h4 className="font-bold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-2">
                  <span className="text-lg">🔗</span> {t('steps.chunking.whyOverlap.title')}
                </h4>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  {t('steps.chunking.whyOverlap.reason')}
                </p>
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-base font-mono">
                  <div className="text-red-500">❌ {t('steps.chunking.whyOverlap.bad')}</div>
                  <div className="text-green-600">✓ {t('steps.chunking.whyOverlap.good', { overlap: chunkingConfig.overlap })}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
