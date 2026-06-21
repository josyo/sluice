import { useRef, useState } from 'react'
import { useScenarioStore }    from '../stores/scenario.store'
import { useEnvironmentStore } from '../stores/environment.store'
import { useHistoryStore }     from '../stores/history.store'
import { runRequest }          from '../lib/request-runner'
import { evaluateAssertions }  from '../lib/assertion-engine'
import { resolvePath }         from '../lib/variable-parser'
import type { StepResult, RunResult } from '../types'

type RunStatus = 'idle' | 'running' | 'done' | 'cancelled'

interface RunnerState {
  status:            RunStatus
  currentStepIndex:  number | null   // which step is actively executing
  results:           StepResult[]    // results collected so far (updates live)
  lastRun:           RunResult | null
}

export function useRunner() {
  const [state, setState] = useState<RunnerState>({
    status:           'idle',
    currentStepIndex: null,
    results:          [],
    lastRun:          null,
  })

  // AbortController ref so we can cancel mid-run without stale closures
  const abortRef = useRef<AbortController | null>(null)

  const getActiveScenario  = useScenarioStore(s => s.getActiveScenario)
  const getActiveVariables = useEnvironmentStore(s => s.getActiveVariables)
  const addRun             = useHistoryStore(s => s.addRun)

  const runScenario = async () => {
    const scenario = getActiveScenario()
    if (!scenario || scenario.steps.length === 0) return

    // Fresh abort controller for this run
    abortRef.current = new AbortController()

    setState({
      status:           'running',
      currentStepIndex: 0,
      results:          [],
      lastRun:          null,
    })

    // Runtime variables start as a copy of the active environment.
    // This object grows as each step extracts values from its response.
    // Step 1 might extract an auth token, Step 2 can then use it.
    const runtimeVars: Record<string, string> = { ...getActiveVariables() }

    const stepResults: StepResult[] = []
    const runStart = performance.now()

    for (let i = 0; i < scenario.steps.length; i++) {
      // Check if the user cancelled before starting the next step
      if (abortRef.current.signal.aborted) {
        setState(prev => ({ ...prev, status: 'cancelled', currentStepIndex: null }))
        return
      }

      setState(prev => ({ ...prev, currentStepIndex: i }))

      const step = scenario.steps[i]

      // ── 1. Fire the request ──────────────────────────────────────────────
      // runtimeVars contains env variables + anything extracted so far
      const requestResult = await runRequest(step, runtimeVars)

      // ── 2. Evaluate assertions ───────────────────────────────────────────
      const assertionResults = evaluateAssertions(requestResult, step.assertions)

      // ── 3. Build the step result ─────────────────────────────────────────
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

      // ── 4. Extract variables for downstream steps ────────────────────────
      // Each step can declare extractors like:
      //   { variableName: "authToken", path: "data.token" }
      // We drill into the response body, pull the value, and add it to
      // runtimeVars so Step 2, 3, etc. can reference {{authToken}}
      for (const extractor of step.extractors) {
        const extracted = resolvePath(requestResult.body, extractor.path)
        if (extracted !== undefined && extracted !== null) {
          runtimeVars[extractor.variableName] = String(extracted)
        }
      }

      // ── 5. Push results live so the UI updates as each step finishes ─────
      setState(prev => ({ ...prev, results: [...stepResults] }))
    }

    // ── Build the final run record and save it ───────────────────────────────
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

    setState({
      status:           'done',
      currentStepIndex: null,
      results:          stepResults,
      lastRun:          runResult,
    })
  }

  const cancelRun = () => {
    abortRef.current?.abort()
    // State update happens inside runScenario when it detects the abort
  }

  // Run a single step in isolation — useful when building a scenario and
  // you want to test one step without running the whole chain
  const runSingleStep = async (stepId: string): Promise<StepResult | null> => {
    const scenario = getActiveScenario()
    if (!scenario) return null

    const step = scenario.steps.find(s => s.id === stepId)
    if (!step) return null

    const requestResult  = await runRequest(step, getActiveVariables())
    const assertionResults = evaluateAssertions(requestResult, step.assertions)

    return {
      stepId:        step.id,
      stepName:      step.name,
      status:        requestResult.status,
      statusText:    requestResult.statusText,
      duration:      requestResult.duration,
      body:          requestResult.body,
      headers:       requestResult.headers,
      ok:            requestResult.ok,
      error:         requestResult.error,
      passed:        assertionResults.every(r => r.passed),
      assertionResults,
    }
  }

  return {
    ...state,
    isRunning: state.status === 'running',
    runScenario,
    cancelRun,
    runSingleStep,
  }
}