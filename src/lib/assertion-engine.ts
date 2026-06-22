import type { Assertion, AssertionResult } from '../types'
import type { RequestResult } from './request-runner'
import { resolvePath } from './variable-parser'   // single source of truth — no local duplicate

/**
 * Evaluates all assertions against a completed request result.
 * Returns one AssertionResult per assertion.
 */
export function evaluateAssertions(
  result:     RequestResult,
  assertions: Assertion[]
): AssertionResult[] {
  return assertions.map(assertion => evaluate(result, assertion))
}

function evaluate(result: RequestResult, assertion: Assertion): AssertionResult {
  const actual  = resolveTarget(result, assertion)
  const passed  = runOperator(actual, assertion.operator, assertion.expected)
  const message = buildMessage(assertion, actual, passed)
  return { assertion, passed, actual, message }
}

function resolveTarget(result: RequestResult, assertion: Assertion): unknown {
  switch (assertion.target) {
    case 'status':
      return result.status

    case 'body':
      return assertion.path ? resolvePath(result.body, assertion.path) : result.body

    case 'header':
      if (!assertion.path) return undefined
      return result.headers[assertion.path.toLowerCase()]

    default:
      return undefined
  }
}

function runOperator(
  actual:   unknown,
  operator: Assertion['operator'],
  expected: Assertion['expected']
): boolean {
  switch (operator) {
    case 'eq':
      // eslint-disable-next-line eqeqeq
      return actual == expected

    case 'neq':
      // eslint-disable-next-line eqeqeq
      return actual != expected

    case 'exists':
      return actual !== undefined && actual !== null

    case 'contains':
      if (typeof actual === 'string') return actual.includes(String(expected))
      if (Array.isArray(actual))      return actual.includes(expected)
      return false

    case 'gt':
      return typeof actual === 'number' && actual > Number(expected)

    case 'lt':
      return typeof actual === 'number' && actual < Number(expected)

    default:
      return false
  }
}

function buildMessage(assertion: Assertion, actual: unknown, passed: boolean): string {
  const target      = assertion.path ? `${assertion.target}.${assertion.path}` : assertion.target
  const expectedPart = assertion.operator === 'exists' ? '' : String(assertion.expected)
  const icon        = passed ? '✓' : '✗'
  return `${target} ${assertion.operator} ${expectedPart} → got ${JSON.stringify(actual)} ${icon}`.trim()
}
