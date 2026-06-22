import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RunResult } from '../types'

const MAX_RUNS = 100

interface HistoryStore {
  runs: RunResult[]
  addRun:               (run: RunResult) => void
  removeRun:            (id: string) => void
  clearHistory:         () => void
  clearScenarioHistory: (scenarioId: string) => void
  getRunsForScenario:   (scenarioId: string) => RunResult[]
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      runs: [],

      addRun: (run) => {
        set(state => {
          const updated = [run, ...state.runs]
          return { runs: updated.slice(0, MAX_RUNS) }
        })
      },

      removeRun: (id) => {
        set(state => ({ runs: state.runs.filter(r => r.id !== id) }))
      },

      clearHistory: () => set({ runs: [] }),

      clearScenarioHistory: (scenarioId) => {
        set(state => ({ runs: state.runs.filter(r => r.scenarioId !== scenarioId) }))
      },

      getRunsForScenario: (scenarioId) => {
        return get().runs.filter(r => r.scenarioId === scenarioId)
      },
    }),
    { name: 'sluice-history' }
  )
)
