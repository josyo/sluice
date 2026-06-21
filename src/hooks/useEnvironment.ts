import  {useEnvironmentStore}  from '../stores/environment.store'

export function useEnvironment() {
    const store = useEnvironmentStore()
    
    // Get the currently active environment
    const activeEnvironment = store.environments.find(
        e => e.id === store.activeEnvironmentId
    ) ?? null

    return {
        environments:         store.environments,
        activeEnvironment,
        activeEnvironmentId:  store.activeEnvironmentId,
        addEnvironment:       store.addEnvironment,
        removeEnvironment:    store.removeEnvironment,
        setActiveEnvironment: store.setActiveEnvironment,
        setVariable:          store.setVariable,
        removeVariable:       store.removeVariable,
        getActiveVariables:   store.getActiveVariables,
    }
}
