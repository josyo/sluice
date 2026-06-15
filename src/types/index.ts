type HttpMethod = 'GET' | 'POST' | ' PUT' | 'PATCH' | 'DELETE'

 export interface RequestStep {
    id: string
    name: string
    method: HttpMethod
    url: string
    headers: Record<string, string> //Learn more
    body?: string
    assertions: Assertion[] //Learn more
    extractors: Extractor[] //Learn more
}

export interface Assertion {
    target: 'status' | 'body' | 'header'
    path?: string
    operator: 'eq' | 'neq' | 'exists' | 'contains' | 'gt' | 'lt'
    expected: string | number | boolean
}

interface Extractor {
    variableName: string
    path: string
}

export interface Scenario {
    id: string
    name: string
    steps: RequestStep[]
    createdAt: string
}

export interface Environment {
    id: string
    name: string
    variables: Record<string, string>
}

export interface RunResult {
    id: string
    scenarioId: string
    scenarioName: string
    runAt: string 
    passed: boolean
    totalDuration: number
    stepResults: StepResult[]
}

export interface StepResult {
    stepId: string
    stepName: string
    status: number
    statusText: string
    duration: number
    body: unknown
    headers: Record<string, string>
    ok: boolean
    error?: boolean
    passed: boolean
    assertionResults: import('../lib/assertion-engine').AssertionResult[]
}

