import { useTranslation } from 'react-i18next'
import { Github, ExternalLink } from 'lucide-react'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('footer.builtWith')}
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/franzenzenhofer/rag-visualizer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Github className="w-4 h-4" />
              {t('footer.github')}
            </a>
            <a
              href="#"
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {t('footer.learnMore')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
