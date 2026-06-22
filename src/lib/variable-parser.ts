/**
 * Replaces all {{placeholder}} occurrences in a string with values
 * from the provided variables object.
 */
export function parseVariables(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (match, key) => {
    const value = resolvePath(variables, key)
    return value !== undefined ? String(value) : match
  })
}

/**
 * Drills into a nested object using a dot-notation path.
 * Accepts `unknown` so it works on both env variable objects and raw response bodies.
 *
 * Example:
 *   resolvePath({ data: { token: "abc" } }, "data.token") → "abc"
 */
export function resolvePath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current !== null && typeof current === 'object' && key in (current as object)) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * Applies variable parsing to every string field in a request step
 * before the request fires.
 */
export function parseStepVariables(
  step: { url: string; headers: Record<string, string>; body?: string },
  variables: Record<string, string>
) {
  return {
    url: parseVariables(step.url, variables),
    headers: Object.fromEntries(
      Object.entries(step.headers).map(([key, value]) => [
        key,
        parseVariables(value, variables),
      ])
    ),
    body: step.body ? parseVariables(step.body, variables) : undefined,
  }
}
