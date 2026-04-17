import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Info, X } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Header() {
  const { t } = useTranslation()
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-2 bg-blue-100 rounded-xl">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {t('app.title')}
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              {t('app.subtitle')}
            </p>
          </div>
        </motion.div>

        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Privacy Info Button */}
          <div className="relative">
            <button
              onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Privacy information"
            >
              <Info className="w-5 h-5" />
            </button>

            {/* Privacy Info Popover */}
            <AnimatePresence>
              {showPrivacyInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-900">Privacy & Transparency</span>
                    <button
                      onClick={() => setShowPrivacyInfo(false)}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-start gap-2">
                      <span>🔒</span>
                      <span>Your documents stay on your device</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span>📦</span>
                      <span>AI model (~30MB) downloaded once from HuggingFace</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span>📄</span>
                      <span>PDF.js worker loaded from CDN</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span>📊</span>
                      <span>No analytics or tracking</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <LanguageSwitcher />
        </motion.div>
      </div>
    </header>
  )
}
