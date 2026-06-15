import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Environment } from '../types'

interface EnvironmentStore {
  environments: Environment[]
  activeEnvironmentId: string | null

  addEnvironment:      (name: string) => void
  removeEnvironment:   (id: string) => void
  setActiveEnvironment:(id: string) => void
  setVariable:         (envId: string, key: string, value: string) => void
  removeVariable:      (envId: string, key: string) => void

  // Called by the runner — not a React hook, just a plain getter
  getActiveVariables: () => Record<string, string>
}

export const useEnvironmentStore = create<EnvironmentStore>()(
  persist(
    (set, get) => ({
      environments: [],
      activeEnvironmentId: null,

      addEnvironment: (name) => {
        const env: Environment = {
          id: crypto.randomUUID(),
          name,
          variables: {},
        }
        set(state => ({
          environments: [...state.environments, env],
          // First environment created becomes active automatically
          activeEnvironmentId: state.activeEnvironmentId ?? env.id,
        }))
      },

      removeEnvironment: (id) => {
        set(state => ({
          environments: state.environments.filter(e => e.id !== id),
          // If we deleted the active one, fall back to null
          activeEnvironmentId:
            state.activeEnvironmentId === id ? null : state.activeEnvironmentId,
        }))
      },

      setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),

      setVariable: (envId, key, value) => {
        set(state => ({
          environments: state.environments.map(env =>
            env.id === envId
              ? { ...env, variables: { ...env.variables, [key]: value } }
              : env
          ),
        }))
      },

      removeVariable: (envId, key) => {
        set(state => ({
          environments: state.environments.map(env => {
            if (env.id !== envId) return env
            // Destructure out the key we want to remove
            const { [key]: _removed, ...rest } = env.variables
            return { ...env, variables: rest }
          }),
        }))
      },

      getActiveVariables: () => {
        const { environments, activeEnvironmentId } = get()
        const active = environments.find(e => e.id === activeEnvironmentId)
        // Falls back to empty object if no active env — runner handles this gracefully
        return active?.variables ?? {}
      },
    }),
    { name: 'sluice-environments' } // localStorage key
  )
)