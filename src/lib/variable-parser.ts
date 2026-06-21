// Replaces every {{placeholder}} in a string
export function parseVariables(
    template: string, variables: Record<string, string>
) : string{
    return template.replace(/\{\{([\w.]+)\}\}/g, (match, key) => { ///\{\{([\w.]+)\}\}/g - an expression in js that finds all placeholders
        const value = resolvePath(variables, key)
        return value !== undefined ? String(value): match
    })
}

// Seperates dot notaion - user.id becomers "user": "id"
export function resolvePath(
    obj: Record<string, unknown>,
    path: string
) : unknown {
    return path.split('.').reduce<unknown>((current, key) => {
        if (current !== null && typeof current === 'object' && key in (current as object)) {
            return (current as Record<string, unknown>)[key]
        }
        return undefined
    }, obj)
}

// Applies the variables replacements "url from the variable" gets passed to {{url}}
export function parseStepVariables(
    step: {
        url: string
        headers: Record<string, string>
        body?: string
    },
    variables: Record<string, string>
) {
    return {
        url: parseVariables(step.url, variables),

        // Each header value can have placeholders too
        // e.g "Authorization : Bearer {{token}}"

        headers: Object.fromEntries(
            Object.entries(step.headers).map(([key, value]) => [
                key,
                parseVariables(value, variables),
            ])
        ),

        // Body is optional - only parse if it exists
        body: step.body ? parseVariables(step.body, variables) : undefined
    }
}