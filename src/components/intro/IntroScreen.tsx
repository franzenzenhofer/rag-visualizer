import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'

export function IntroScreen() {
  const { t } = useTranslation()
  const { setCurrentStep } = useUIStore()

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center pt-6 pb-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium mb-5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('introScreen.badge')}</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
          {t('introScreen.heroLine1')}
          <br />
          <span className="text-blue-600">{t('introScreen.heroLine2')}</span>
        </h1>
        <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          {t('introScreen.lede')}
        </p>
      </motion.div>

      {/* Visible vs hidden diagram */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid sm:grid-cols-2 gap-4 mb-10"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 mb-3">
            <Eye className="w-4 h-4" />
            <span>{t('introScreen.visibleLabel')}</span>
          </div>
          <div className="text-gray-900 font-semibold mb-2">{t('introScreen.visibleTitle')}</div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t('introScreen.visibleBody')}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {['upload', 'chunk', 'embed', 'retrieve', 'generate'].map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-900 bg-gray-900 text-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-3">
            <EyeOff className="w-4 h-4" />
            <span>{t('introScreen.hiddenLabel')}</span>
          </div>
          <div className="text-white font-semibold mb-2">{t('introScreen.hiddenTitle')}</div>
          <p className="text-sm text-gray-300 leading-relaxed">
            {t('introScreen.hiddenBody')}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {['web_search', 'file_search', 'code_execution', 'memory', 'grounding'].map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-200 border border-white/10 font-mono"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* The one-line insight */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-6 mb-10"
      >
        <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
          {t('introScreen.insightLabel')}
        </div>
        <p className="text-xl sm:text-2xl font-semibold text-gray-900 leading-snug">
          {t('introScreen.insightLine')}
        </p>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          {t('introScreen.insightBody')}
        </p>
      </motion.div>

      {/* What you'll learn */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mb-10"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('introScreen.learnTitle')}</h2>
        <div className="grid sm:grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-gray-200 bg-white p-4 text-center"
            >
              <div className="w-7 h-7 mx-auto mb-2 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                {n}
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {t(`introScreen.step${n}Title`)}
              </div>
              <div className="text-xs text-gray-500 mt-1 leading-snug">
                {t(`introScreen.step${n}Body`)}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="text-center pb-6"
      >
        <button
          onClick={() => setCurrentStep(1)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors"
        >
          {t('introScreen.cta')}
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-xs text-gray-500 mt-3">{t('introScreen.ctaNote')}</p>
      </motion.div>
    </div>
  )
}
