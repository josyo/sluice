import { useState } from 'react'
import { Badge }      from '@/components/ui/badge'
import { Button }     from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle, XCircle, Clock, Copy, Check } from 'lucide-react'
import type { StepResult } from '../../types'

type RunStatus = 'idle' | 'running' | 'done' | 'cancelled'

interface Props {
  status:         RunStatus
  results:        StepResult[]
  totalDuration?: number
}

export function RunResultsPanel({ status, results, totalDuration }: Props) {
  if (status === 'idle') {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Hit Run to execute the scenario
      </div>
    )
  }

  const allPassed = results.length > 0 && results.every(r => r.passed)

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b flex items-center gap-3 shrink-0">
        <p className="text-sm font-medium">Results</p>

        {status === 'running' && (
          <Badge variant="outline" className="animate-pulse">Running…</Badge>
        )}
        {status === 'done' && (
          <Badge variant={allPassed ? 'default' : 'destructive'}>
            {allPassed ? 'All passed' : 'Some failed'}
          </Badge>
        )}
        {status === 'cancelled' && (
          <Badge variant="outline">Cancelled</Badge>
        )}

        {totalDuration !== undefined && status === 'done' && (
          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
            <Clock size={11} />{totalDuration}ms total
          </span>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {results.map(r => <StepResultCard key={r.stepId} result={r} />)}
        </div>
      </ScrollArea>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      size="icon" variant="ghost" className="h-6 w-6 shrink-0"
      onClick={e => { e.stopPropagation(); handleCopy() }}
      title="Copy to clipboard"
    >
      {copied
        ? <Check size={11} className="text-green-500" />
        : <Copy  size={11} />
      }
    </Button>
  )
}

function StepResultCard({ result }: { result: StepResult }) {
  const bodyText = JSON.stringify(result.body, null, 2)

  return (
    <div className="border rounded-lg overflow-hidden">

      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40">
        {result.passed
          ? <CheckCircle size={14} className="text-green-500 shrink-0" />
          : <XCircle    size={14} className="text-red-500   shrink-0" />
        }
        <span className="text-sm font-medium flex-1">{result.stepName}</span>
        <Badge variant="outline" className="text-xs">{result.status} {result.statusText}</Badge>
        <span className="text-xs text-muted-foreground">{result.duration}ms</span>
      </div>

      {/* Assertion results */}
      {result.assertionResults.length > 0 && (
        <div className="px-3 py-2 border-t space-y-1">
          {result.assertionResults.map((ar, i) => (
            <p key={i} className="text-xs font-mono text-muted-foreground">
              {ar.passed ? '✓' : '✗'} {ar.message}
            </p>
          ))}
        </div>
      )}

      {/* Network / fetch error */}
      {result.error && (
        <div className="px-3 py-2 border-t">
          <p className="text-xs text-red-500">{result.error}</p>
        </div>
      )}

      {/* Response body — collapsible with copy button */}
      {result.body !== null && !result.error && (
        <details className="border-t">
          <summary className="flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground cursor-pointer hover:bg-accent/30 list-none">
            <span>Response body</span>
            <CopyButton text={bodyText} />
          </summary>
          <pre className="px-3 py-2 text-xs font-mono overflow-auto max-h-40 bg-muted/20">
            {bodyText}
          </pre>
        </details>
      )}
    </div>
  )
}
