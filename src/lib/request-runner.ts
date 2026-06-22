import { parseStepVariables } from './variable-parser'
import type { RequestStep } from '../types'

export interface RequestResult {
  status:     number
  statusText: string
  headers:    Record<string, string>
  body:       unknown
  duration:   number
  ok:         boolean
  error?:     string
}

/**
 * Fires a single HTTP request with variables already resolved.
 * Accepts an optional AbortSignal so in-flight requests can be cancelled.
 */
export async function runRequest(
  step:      RequestStep,
  variables: Record<string, string>,
  signal?:   AbortSignal
): Promise<RequestResult> {

  // Fill in all {{placeholders}} before building the request
  const parsed = parseStepVariables(
    { url: step.url, headers: step.headers, body: step.body },
    variables
  )

  const startTime = performance.now()

  try {
    const options: RequestInit = {
      method:  step.method,
      headers: parsed.headers,
      signal,           // passed through so fetch() actually respects cancel
    }

    if (parsed.body && !['GET', 'DELETE'].includes(step.method)) {
      options.body = parsed.body

      // Auto-set Content-Type to application/json if the body is valid JSON
      // and the user hasn't already set a Content-Type header manually
      const hasContentType = Object.keys(parsed.headers).some(
        k => k.toLowerCase() === 'content-type'
      )
      if (!hasContentType) {
        try {
          JSON.parse(parsed.body)
          options.headers = { ...parsed.headers, 'Content-Type': 'application/json' }
        } catch {
          // Body is not JSON — leave headers as-is
        }
      }
    }

    const response = await fetch(parsed.url, options)
    const duration = Math.round(performance.now() - startTime)

    // Try JSON first, fall back to text
    let body: unknown
    const contentType = response.headers.get('content-type') ?? ''
    try {
      body = contentType.includes('application/json')
        ? await response.json()
        : await response.text()
    } catch {
      body = null
    }

    // Flatten response headers into a plain object
    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => { headers[key] = value })

    return { status: response.status, statusText: response.statusText, headers, body, duration, ok: response.ok }

  } catch (err) {
    const duration = Math.round(performance.now() - startTime)

    // AbortError means the user hit Stop — not a real failure
    if (err instanceof Error && err.name === 'AbortError') {
      return { status: 0, statusText: 'Cancelled', headers: {}, body: null, duration, ok: false, error: 'Request was cancelled' }
    }

    return {
      status:     0,
      statusText: 'Network Error',
      headers:    {},
      body:       null,
      duration,
      ok:         false,
      error:      err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
