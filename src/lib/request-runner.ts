import { parseStepVariables } from './variable-parser'
import type { RequestStep } from '../types/index'

// This is what the runner returns after ever request.
export interface RequestResult {
    status: number
    statusText: string
    headers: Record<string, string>
    body: unknown
    duration: number        // how long the request took in ms
    ok: boolean             // true if status is 200-299
    error?: string          // only set on network failure (CORS, no internet etc)
}

export async function runRequest(
    step: RequestStep,
    variables: Record<string, string>
) : Promise<RequestResult> {

    // Fill in all {{placeholders}} beofre doing anything else
    const parsed = parseStepVariables(
        {
            url: step.url,
            headers: step.headers,
            body: step.body,
        },
        variables
    )

    // Start the clock
    const startTime = performance.now()
    
    try {
        // Build fetch options
        const options: RequestInit = {
            method: step.method,
            headers: parsed.headers,
        }

        // Attaches a body if it's present
        if (parsed.body && !['GET', 'DELETE'].includes(step.method)) {
                options.body = parsed.body    
        }

        // Fire the request
        const response = await fetch(parsed.url, options)

        // Stop the clock
        const duration = Math.round(performance.now() -startTime)

        // Parse the response body 
        // Try JSON first since most APIs return JSON
        // If it's not JSON fall back to previous text
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
        // The headers API is iterable but not a plain object, wo we covert it
        const headers: Record<string, string> = {}
        response.headers.forEach((value, key) => {
            headers[key] = value
        })

        return {
            status: response.status,
            statusText: response.statusText,
            headers,
            body,
            duration, 
            ok: response.ok,  
        }

    }catch (err) {
        // This catch only runs on network-level failures:
        // - No internet
        // - CORS blocked
        // - DNS failed
        // - Timeout
        // A 404 or 500 from the server does NOT land here — it goes through the try block above
        const duration = Math.round(performance.now() - startTime)

        return {
            status: 0,
            statusText: 'Network Error',
            headers: {},
            body:  null,
            duration,
            ok: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        }
    }
}