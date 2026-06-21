import { useScenarioStore } from  '../stores/scenario.store'

export function useScenario() {
    const store = useScenarioStore()

    const activeScenario = store.getActiveScenario() ?? null

    return {
    scenarios:         store.scenarios,
    activeScenario,
    activeScenarioId:  store.activeScenarioId,
    addScenario:       store.addScenario,
    removeScenario:    store.removeScenario,
    setActiveScenario: store.setActiveScenario,
    addStep:           store.addStep,
    updateStep:        store.updateStep,
    removeStep:        store.removeStep,
    reorderSteps:      store.reorderSteps,
  }
}