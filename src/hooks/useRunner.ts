import { useCallback, useRef, useState } from 'react'
import { useScenarioStore }    from '../stores/scenario.store'
import { useEnvironmentStore } from '../stores/environment.store'
import { useHistoryStore }     from '../stores/history.store'
import { runRequest }          from '../lib/request-runner'
import { evaluateAssertions }  from '../lib/assertion-engine'
import { resolvePath }         from '../lib/variable-parser'
import type { StepResult, RunResult } from '../types'

type RunStatus = 'idle' | 'running' | 'done' | 'cancelled'

interface RunnerState {
  status:           RunStatus
  currentStepIndex: number | null
  results:          StepResult[]
  lastRun:          RunResult | null
}

const INITIAL_STATE: RunnerState = {
  status:           'idle',
  currentStepIndex: null,
  results:          [],
  lastRun:          null,
}

export function useRunner() {
  const [state, setState] = useState<RunnerState>(INITIAL_STATE)
  const abortRef = useRef<AbortController | null>(null)

  const getActiveScenario  = useScenarioStore(s => s.getActiveScenario)
  const getActiveVariables = useEnvironmentStore(s => s.getActiveVariables)
  const addRun             = useHistoryStore(s => s.addRun)

  // ── clearResults ────────────────────────────────────────────────────────────
  // Called by ScenarioPage when switching scenarios so stale results never show
  const clearResults = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])

  // ── runScenario ─────────────────────────────────────────────────────────────
  const runScenario = useCallback(async () => {
    const scenario = getActiveScenario()
    if (!scenario || scenario.steps.length === 0) return

    // Fresh controller for this run
    abortRef.current = new AbortController()

    setState({ status: 'running', currentStepIndex: 0, results: [], lastRun: null })

    // Start with env variables; grows as each step's extractors fire
    const runtimeVars: Record<string, string> = { ...getActiveVariables() }
    const stepResults: StepResult[] = []
    const runStart = performance.now()

    for (let i = 0; i < scenario.steps.length; i++) {
      if (abortRef.current.signal.aborted) {
        setState(prev => ({ ...prev, status: 'cancelled', currentStepIndex: null }))
        return
      }

      setState(prev => ({ ...prev, currentStepIndex: i }))

      const step = scenario.steps[i]

      // Pass the signal so fetch() actually cancels when Stop is clicked
      const requestResult    = await runRequest(step, runtimeVars, abortRef.current.signal)
      const assertionResults = evaluateAssertions(requestResult, step.assertions)

      const stepResult: StepResult = {
        stepId:           step.id,
        stepName:         step.name,
        status:           requestResult.status,
        statusText:       requestResult.statusText,
        duration:         requestResult.duration,
        body:             requestResult.body,
        headers:          requestResult.headers,
        ok:               requestResult.ok,
        error:            requestResult.error,
        passed:           assertionResults.every(r => r.passed),
        assertionResults,
      }

      stepResults.push(stepResult)

      // Extract variables from this response for downstream steps
      for (const extractor of step.extractors) {
        const extracted = resolvePath(requestResult.body, extractor.path)
        if (extracted !== undefined && extracted !== null) {
          runtimeVars[extractor.variableName] = String(extracted)
        }
      }

      // Update results live so the UI reflects each step as it completes
      setState(prev => ({ ...prev, results: [...stepResults] }))
    }

    const runResult: RunResult = {
      id:            crypto.randomUUID(),
      scenarioId:    scenario.id,
      scenarioName:  scenario.name,
      ranAt:         new Date().toISOString(),
      passed:        stepResults.every(r => r.passed),
      totalDuration: Math.round(performance.now() - runStart),
      stepResults,
    }

    addRun(runResult)
    setState({ status: 'done', currentStepIndex: null, results: stepResults, lastRun: runResult })
  }, [getActiveScenario, getActiveVariables, addRun])

  // ── cancelRun ───────────────────────────────────────────────────────────────
  // Aborts the controller — fetch() receives the signal and throws AbortError,
  // which request-runner catches and returns as a clean "Cancelled" result
  const cancelRun = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  // ── runSingleStep ────────────────────────────────────────────────────────────
  // Runs one step in isolation. Updates the results array so StepCard shows feedback.
  const runSingleStep = useCallback(async (stepId: string): Promise<StepResult | null> => {
    const scenario = getActiveScenario()
    if (!scenario) return null

    const step      = scenario.steps.find(s => s.id === stepId)
    const stepIndex = scenario.steps.findIndex(s => s.id === stepId)
    if (!step) return null

    // Show this step as actively running
    setState(prev => ({ ...prev, status: 'running', currentStepIndex: stepIndex }))

    const requestResult    = await runRequest(step, getActiveVariables())
    const assertionResults = evaluateAssertions(requestResult, step.assertions)

    const stepResult: StepResult = {
      stepId:           step.id,
      stepName:         step.name,
      status:           requestResult.status,
      statusText:       requestResult.statusText,
      duration:         requestResult.duration,
      body:             requestResult.body,
      headers:          requestResult.headers,
      ok:               requestResult.ok,
      error:            requestResult.error,
      passed:           assertionResults.every(r => r.passed),
      assertionResults,
    }

    // Replace if a result already exists for this step, otherwise append
    setState(prev => ({
      ...prev,
      status:           'done',
      currentStepIndex: null,
      results: prev.results.some(r => r.stepId === stepId)
        ? prev.results.map(r => r.stepId === stepId ? stepResult : r)
        : [...prev.results, stepResult],
    }))

    return stepResult
  }, [getActiveScenario, getActiveVariables])

  return {
    ...state,
    isRunning: state.status === 'running',
    runScenario,
    cancelRun,
    runSingleStep,
    clearResults,
  }
}
