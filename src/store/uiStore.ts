import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UIState } from '../types'

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      currentStep: 0,
      setCurrentStep: (step: number) => set({ currentStep: step }),

      language: 'en',
      setLanguage: (lang: 'en' | 'de') => set({ language: lang }),
    }),
    {
      name: 'rag-visualizer-ui',
      partialize: (state) => ({
        language: state.language,
      }),
    }
  )
)
