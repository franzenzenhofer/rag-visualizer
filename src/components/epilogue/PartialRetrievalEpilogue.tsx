import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { RotateCcw, ExternalLink } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useRAGStore } from '../../store/ragStore'

type ProductRow = {
  name: string
  mechanism: string
  transparency: 'visible' | 'partial' | 'hidden'
}

const PRODUCTS: ProductRow[] = [
  { name: "Claude (web_search, file_search, code_execution)", mechanism: 'epilogue.products.claude', transparency: 'partial' },
  { name: 'ChatGPT (Search, Projects, Memory)',               mechanism: 'epilogue.products.chatgpt', transparency: 'partial' },
  { name: 'Gemini (Google Search grounding)',                 mechanism: 'epilogue.products.gemini', transparency: 'partial' },
  { name: 'Perplexity',                                       mechanism: 'epilogue.products.perplexity', transparency: 'visible' },
  { name: 'Cursor / Claude Code',                             mechanism: 'epilogue.products.code', transparency: 'partial' },
  { name: 'Agent frameworks (tool-use)',                      mechanism: 'epilogue.products.agents', transparency: 'partial' },
]

const TRANSPARENCY_STYLE: Record<ProductRow['transparency'], string> = {
  visible: 'bg-green-50 text-green-700 border-green-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  hidden:  'bg-red-50 text-red-700 border-red-200',
}

export function PartialRetrievalEpilogue() {
  const { t } = useTranslation()
  const { setCurrentStep } = useUIStore()
  const { reset } = useRAGStore()

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center pt-6 pb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-medium mb-5">
          <span>{t('epilogue.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          {t('epilogue.title')}
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          {t('epilogue.lede')}
        </p>
      </motion.div>

      {/* The same-pipeline callout */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-2xl border border-gray-200 bg-white p-6 mb-8"
      >
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
          {t('epilogue.samePipelineLabel')}
        </div>
        <div className="grid sm:grid-cols-5 gap-2 text-center text-sm">
          {['upload', 'chunk', 'embed', 'retrieve', 'generate'].map((k, i) => (
            <div key={k} className="p-3 rounded-xl bg-blue-50 border border-blue-100">
              <div className="text-blue-700 font-semibold">{i + 1}. {t(`epilogue.pipeline.${k}Short`)}</div>
              <div className="text-xs text-blue-900/70 mt-1">{t(`epilogue.pipeline.${k}Hidden`)}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-600 leading-relaxed">{t('epilogue.samePipelineBody')}</p>
      </motion.div>

      {/* Products table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-2xl border border-gray-200 bg-white overflow-hidden mb-8"
      >
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{t('epilogue.productsTitle')}</h2>
          <p className="text-sm text-gray-600 mt-1">{t('epilogue.productsLede')}</p>
        </div>
        <div className="divide-y divide-gray-100">
          {PRODUCTS.map((p) => (
            <div key={p.name} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="sm:w-1/3">
                <div className="font-semibold text-gray-900 text-sm">{p.name}</div>
              </div>
              <div className="flex-1 text-sm text-gray-600 leading-relaxed">
                {t(p.mechanism)}
              </div>
              <div>
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${TRANSPARENCY_STYLE[p.transparency]}`}
                >
                  {t(`epilogue.transparency.${p.transparency}`)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Takeaways */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid sm:grid-cols-3 gap-3 mb-8"
      >
        {[1, 2, 3].map((n) => (
          <div key={n} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
              {t(`epilogue.takeaway${n}Label`)}
            </div>
            <div className="text-sm text-gray-800 leading-relaxed">
              {t(`epilogue.takeaway${n}Body`)}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Closing */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 mb-8"
      >
        <h3 className="text-lg font-bold mb-2">{t('epilogue.closingTitle')}</h3>
        <p className="text-sm text-gray-300 leading-relaxed">{t('epilogue.closingBody')}</p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-3 justify-center items-center pb-6"
      >
        <button
          onClick={() => {
            reset()
            setCurrentStep(0)
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {t('epilogue.restart')}
        </button>
        <a
          href="https://arxiv.org/abs/2005.11401"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-gray-200 text-gray-800 font-medium hover:bg-gray-50 transition-colors"
        >
          {t('epilogue.paperLink')}
          <ExternalLink className="w-4 h-4" />
        </a>
      </motion.div>
    </div>
  )
}
