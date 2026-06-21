export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface Assertion {
  target:   'status' | 'body' | 'header'
  path?:    string
  operator: 'eq' | 'neq' | 'exists' | 'contains' | 'gt' | 'lt'
  expected: string | number | boolean
}

export interface Extractor {
  variableName: string
  path:         string
}

export interface RequestStep {
  id:          string
  name:        string
  method:      HttpMethod
  url:         string
  headers:     Record<string, string>
  body?:       string
  assertions:  Assertion[]
  extractors:  Extractor[]
}

export interface Scenario {
  id:        string
  name:      string
  steps:     RequestStep[]
  createdAt: string
}

export interface Environment {
  id:        string
  name:      string
  variables: Record<string, string>
}

// Moved here from assertion-engine.ts so all files share one source of truth
export interface AssertionResult {
  assertion: Assertion
  passed:    boolean
  actual:    unknown
  message:   string
}

export interface StepResult {
  stepId:           string
  stepName:         string
  status:           number
  statusText:       string
  duration:         number
  body:             unknown
  headers:          Record<string, string>
  ok:               boolean
  error?:           string
  passed:           boolean
  assertionResults: AssertionResult[]
}

export interface RunResult {
  id:            string
  scenarioId:    string
  scenarioName:  string
  ranAt:         string
  passed:        boolean
  totalDuration: number
  stepResults:   StepResult[]
}