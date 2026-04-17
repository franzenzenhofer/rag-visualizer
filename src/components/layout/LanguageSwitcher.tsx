import { useTranslation } from 'react-i18next'
import { useUIStore } from '../../store/uiStore'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const { language, setLanguage } = useUIStore()

  const handleLanguageChange = (lang: 'en' | 'de') => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          language === 'en'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => handleLanguageChange('de')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          language === 'de'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        DE
      </button>
    </div>
  )
}
