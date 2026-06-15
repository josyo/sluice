import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Scenario, RequestStep } from '../types'

interface ScenarioStore {
  scenarios: Scenario[]
  activeScenarioId: string | null

  addScenario:    (name: string) => void
  removeScenario: (id: string) => void
  setActiveScenario: (id: string) => void
  addStep:        (scenarioId: string, step: Omit<RequestStep, 'id'>) => void
  updateStep:     (scenarioId: string, stepId: string, updates: Partial<RequestStep>) => void
  removeStep:     (scenarioId: string, stepId: string) => void
  reorderSteps:   (scenarioId: string, steps: RequestStep[]) => void

  getActiveScenario: () => Scenario | undefined
}

export const useScenarioStore = create<ScenarioStore>()(
  persist(
    (set, get) => ({
      scenarios: [],
      activeScenarioId: null,

      addScenario: (name) => {
        const scenario: Scenario = {
          id: crypto.randomUUID(),
          name,
          steps: [],
          createdAt: new Date().toISOString(),
        }
        set(state => ({
          scenarios: [...state.scenarios, scenario],
          activeScenarioId: state.activeScenarioId ?? scenario.id,
        }))
      },

      removeScenario: (id) => {
        set(state => ({
          scenarios: state.scenarios.filter(s => s.id !== id),
          // If we deleted the active one, fall back to the next available one
          activeScenarioId:
            state.activeScenarioId === id
              ? state.scenarios.find(s => s.id !== id)?.id ?? null
              : state.activeScenarioId,
        }))
      },

      setActiveScenario: (id) => set({ activeScenarioId: id }),

      addStep: (scenarioId, step) => {
        const newStep: RequestStep = { ...step, id: crypto.randomUUID() }
        set(state => ({
          scenarios: state.scenarios.map(s =>
            s.id === scenarioId
              ? { ...s, steps: [...s.steps, newStep] }
              : s
          ),
        }))
      },

      updateStep: (scenarioId, stepId, updates) => {
        set(state => ({
          scenarios: state.scenarios.map(s =>
            s.id === scenarioId
              ? {
                  ...s,
                  steps: s.steps.map(step =>
                    step.id === stepId ? { ...step, ...updates } : step
                  ),
                }
              : s
          ),
        }))
      },

      removeStep: (scenarioId, stepId) => {
        set(state => ({
          scenarios: state.scenarios.map(s =>
            s.id === scenarioId
              ? { ...s, steps: s.steps.filter(step => step.id !== stepId) }
              : s
          ),
        }))
      },

      reorderSteps: (scenarioId, steps) => {
        set(state => ({
          scenarios: state.scenarios.map(s =>
            s.id === scenarioId ? { ...s, steps } : s
          ),
        }))
      },

      getActiveScenario: () => {
        const { scenarios, activeScenarioId } = get()
        return scenarios.find(s => s.id === activeScenarioId)
      },
    }),
    { name: 'sluice-scenarios' }
  )
)