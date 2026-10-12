import { Suspense, useEffect } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Header, StepIndicator } from './components/layout'
import { IntroScreen } from './components/intro'
import { DocumentUpload } from './components/upload'
import { ChunkingVisualizer } from './components/chunking'
import { EmbeddingVisualizer } from './components/embeddings'
import { RetrievalVisualizer } from './components/retrieval'
import { GenerationVisualizer } from './components/generation'
import { PartialRetrievalEpilogue } from './components/epilogue'
import { LoadingSpinner } from './components/shared'
import { useUIStore } from './store/uiStore'
import { STEPS } from './types'

function StepContent() {
  const { currentStep } = useUIStore()

  const components = [
    <IntroScreen key="intro" />,
    <DocumentUpload key="upload" />,
    <ChunkingVisualizer key="chunking" />,
    <EmbeddingVisualizer key="embedding" />,
    <RetrievalVisualizer key="retrieval" />,
    <GenerationVisualizer key="generation" />,
    <PartialRetrievalEpilogue key="epilogue" />,
  ]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {components[currentStep]}
      </motion.div>
    </AnimatePresence>
  )
}

// Floating minimal navigation
function FloatingNav() {
  const { currentStep, setCurrentStep } = useUIStore()

  const canGoBack = currentStep > 0
  const canGoForward = currentStep < STEPS.length - 1

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 px-2 py-2"
      >
        {/* Back button */}
        <motion.button
          onClick={() => setCurrentStep(currentStep - 1)}
          disabled={!canGoBack}
          whileHover={canGoBack ? { scale: 1.1 } : {}}
          whileTap={canGoBack ? { scale: 0.95 } : {}}
          className={`
            flex items-center justify-center w-10 h-10 rounded-full transition-all
            ${canGoBack
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }
          `}
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>

        {/* Step indicator dots */}
        <div className="flex items-center gap-1.5 px-3">
          {STEPS.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setCurrentStep(i)}
              whileHover={{ scale: 1.2 }}
              className={`
                w-2.5 h-2.5 rounded-full transition-all cursor-pointer
                ${i === currentStep
                  ? 'bg-blue-600 w-6'
                  : i < currentStep
                    ? 'bg-blue-400'
                    : 'bg-gray-300 hover:bg-gray-400'
                }
              `}
            />
          ))}
        </div>

        {/* Forward button */}
        <motion.button
          onClick={() => setCurrentStep(currentStep + 1)}
          disabled={!canGoForward}
          whileHover={canGoForward ? { scale: 1.1 } : {}}
          whileTap={canGoForward ? { scale: 0.95 } : {}}
          className={`
            flex items-center justify-center w-10 h-10 rounded-full transition-all
            ${canGoForward
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }
          `}
        >
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  )
}

function AppContent() {
  // Force LIGHT MODE
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    document.documentElement.style.colorScheme = 'light'
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header and step indicator stick together, so the steps stay visible */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm">
        <Header />
        <div className="border-b border-gray-200">
          <StepIndicator />
        </div>
      </div>

      {/* Main content - extra padding at bottom for floating nav */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-4 pb-24">
        <StepContent />
      </main>

      {/* Floating navigation */}
      <FloatingNav />
    </div>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <LoadingSpinner size="lg" text="Loading..." />
          </div>
        }
      >
        <AppContent />
      </Suspense>
    </MotionConfig>
  )
}
