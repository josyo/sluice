// src/lib/assertion-engine.ts

import type { Assertion, AssertionResult } from '../types'
import type { RequestResult } from './request-runner'


/**
 * Main function. Pass in the full request result and all assertions for that step.
 * Returns one AssertionResult per assertion.
 */
export function evaluateAssertions(
  result: RequestResult,
  assertions: Assertion[]
): AssertionResult[] {
  return assertions.map(assertion => evaluate(result, assertion))
}

// ─── Internal helpers below ───────────────────────────────────────────────────

function evaluate(result: RequestResult, assertion: Assertion): AssertionResult {
  // 1. Get the actual value from the response
  const actual = resolveTarget(result, assertion)

  // 2. Run the comparison
  const passed = runOperator(actual, assertion.operator, assertion.expected)

  // 3. Build a readable message for the UI
  const message = buildMessage(assertion, actual, passed)

  return { assertion, passed, actual, message }
}

/**
 * Extracts the actual value we're testing from the response.
 *
 * target: 'status' → the HTTP status code (number)
 * target: 'body'   → a value drilled out of the response body using dot notation
 * target: 'header' → a specific response header value
 */
function resolveTarget(result: RequestResult, assertion: Assertion): unknown {
  switch (assertion.target) {
    case 'status':
      return result.status

    case 'body':
      // If no path, return the whole body
      // If path is "data.user.id", drill into body to find that value
      return assertion.path
        ? resolvePath(result.body, assertion.path)
        : result.body

    case 'header':
      if (!assertion.path) return undefined
      // Headers are case-insensitive — always compare lowercased
      // "Content-Type" and "content-type" are the same header
      return result.headers[assertion.path.toLowerCase()]

    default:
      return undefined
  }
}

/**
 * Drills into a nested object using a dot-notation path.
 * Works on `unknown` type since response bodies can be anything.
 *
 * Example:
 *   body: { data: { user: { id: "abc123" } } }
 *   path: "data.user.id"
 *   returns: "abc123"
 *
 * If any key in the path doesn't exist, returns undefined cleanly.
 */
function resolvePath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current !== null && typeof current === 'object' && key in (current as object)) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * Runs the actual comparison between the value from the response
 * and the value the user said they expected.
 */
function runOperator(
  actual: unknown,
  operator: Assertion['operator'],
  expected: Assertion['expected']
): boolean {
  switch (operator) {
    case 'eq':
      // Intentionally loose equality here (== not ===)
      // The user types "200" in a text input but status is a number.
      // We don't want that to fail.
      // eslint-disable-next-line eqeqeq
      return actual == expected

    case 'neq':
      // eslint-disable-next-line eqeqeq
      return actual != expected

    case 'exists':
      // Value must be present and not null
      return actual !== undefined && actual !== null

    case 'contains':
      if (typeof actual === 'string') return actual.includes(String(expected))
      if (Array.isArray(actual)) return actual.includes(expected)
      return false

    case 'gt':
      return typeof actual === 'number' && actual > Number(expected)

    case 'lt':
      return typeof actual === 'number' && actual < Number(expected)

    default:
      return false
  }
}

/**
 * Builds the message you'll display in the UI next to each assertion.
 *
 * Examples:
 *   "status eq 200 → got 200 ✓"
 *   "body.data.token exists → got null ✗"
 *   "header.content-type contains application/json → got 'application/json; charset=utf-8' ✓"
 */
function buildMessage(
  assertion: Assertion,
  actual: unknown,
  passed: boolean
): string {
  const target = assertion.path
    ? `${assertion.target}.${assertion.path}`
    : assertion.target

  // 'exists' has no expected value — no point showing it
  const expectedPart = assertion.operator === 'exists'
    ? ''
    : String(assertion.expected)

  const icon = passed ? '✓' : '✗'

  return `${target} ${assertion.operator} ${expectedPart} → got ${JSON.stringify(actual)} ${icon}`.trim()
}