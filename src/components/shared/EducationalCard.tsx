import { Lightbulb } from 'lucide-react'

interface EducationalCardProps {
  title: string
  children: React.ReactNode
}

export function EducationalCard({ title, children }: EducationalCardProps) {
  // Always visible - never collapsed
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3 bg-blue-100/50 dark:bg-blue-800/30 border-b border-blue-200 dark:border-blue-800/50">
        <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          {title}
        </span>
      </div>
      <div className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {children}
      </div>
    </div>
  )
}
