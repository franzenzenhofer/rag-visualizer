import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { STEPS } from '../../types'

export function StepIndicator() {
  const { t } = useTranslation()
  const { currentStep, setCurrentStep } = useUIStore()

  return (
    <div className="w-full py-2 px-4 overflow-x-auto">
      <div className="flex items-center justify-center min-w-max gap-1">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <div key={step.id} className="flex items-center">
              {/* Entire step is a button */}
              <motion.button
                onClick={() => setCurrentStep(index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer
                  ${isCurrent
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : isCompleted
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }
                `}
              >
                {/* Step number/check */}
                <span className={`
                  flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                  ${isCurrent
                    ? 'bg-white/20 text-white'
                    : isCompleted
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }
                `}>
                  {isCompleted ? <Check className="w-3 h-3" /> : index + 1}
                </span>

                {/* Step label */}
                <span className={`text-sm font-medium whitespace-nowrap ${
                  isCurrent ? 'text-white' : ''
                }`}>
                  {t(step.titleKey)}
                </span>
              </motion.button>

              {/* Connector */}
              {index < STEPS.length - 1 && (
                <div className={`w-4 h-0.5 mx-1 ${
                  isCompleted ? 'bg-blue-400' : 'bg-gray-300'
                }`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
