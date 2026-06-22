import { useState } from 'react'
import { useHistoryStore } from '../stores/history.store'
import { Badge }      from '@/components/ui/badge'
import { Button }     from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  CheckCircle, XCircle, ChevronDown, ChevronRight,
  Clock, Trash2, Copy, Check,
} from 'lucide-react'
import type { RunResult } from '../types'

export function HistoryPage() {
  const runs         = useHistoryStore(s => s.runs)
  const clearHistory = useHistoryStore(s => s.clearHistory)
  const removeRun    = useHistoryStore(s => s.removeRun)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (runs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No runs yet. Execute a scenario to see history here.
      </div>
    )
  }

  const handleClearAll = () => {
    if (!window.confirm('Clear all run history? This cannot be undone.')) return
    clearHistory()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <div>
          <h2 className="text-base font-semibold">Run History</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {runs.length} run{runs.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleClearAll}>
          <Trash2 size={14} className="mr-1" />Clear all
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-3">
          {runs.map(run => (
            <RunCard
              key={run.id}
              run={run}
              expanded={expandedId === run.id}
              onToggle={() => setExpandedId(p => p === run.id ? null : run.id)}
              onDelete={() => removeRun(run.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={e => {
        e.stopPropagation()
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="p-1 rounded hover:bg-accent/50 text-muted-foreground"
      title="Copy"
    >
      {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
    </button>
  )
}

function RunCard({ run, expanded, onToggle, onDelete }: {
  run: RunResult; expanded: boolean; onToggle: () => void; onDelete: () => void
}) {
  const passedCount = run.stepResults.filter(s => s.passed).length

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center">
        {/* Clickable expand area */}
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors text-left"
        >
          {run.passed
            ? <CheckCircle size={15} className="text-green-500 shrink-0" />
            : <XCircle    size={15} className="text-red-500   shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{run.scenarioName}</p>
            <p className="text-xs text-muted-foreground">{new Date(run.ranAt).toLocaleString()}</p>
          </div>
          <Badge variant={run.passed ? 'default' : 'destructive'} className="text-xs shrink-0">
            {passedCount}/{run.stepResults.length} passed
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0 mx-2">
            <Clock size={11} />{run.totalDuration}ms
          </span>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Individual delete button */}
        <Button
          size="icon" variant="ghost"
          className="h-8 w-8 mr-2 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={e => { e.stopPropagation(); onDelete() }}
          title="Delete this run"
        >
          <Trash2 size={13} />
        </Button>
      </div>

      {/* Expanded step results */}
      {expanded && (
        <div className="border-t divide-y">
          {run.stepResults.map(sr => (
            <div key={sr.stepId} className="px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                {sr.passed
                  ? <CheckCircle size={13} className="text-green-500 shrink-0" />
                  : <XCircle    size={13} className="text-red-500   shrink-0" />
                }
                <span className="text-sm">{sr.stepName}</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {sr.status} · {sr.duration}ms
                </Badge>
              </div>

              {sr.assertionResults.length > 0 && (
                <div className="pl-5 space-y-1">
                  {sr.assertionResults.map((ar, i) => (
                    <p key={i} className="text-xs font-mono text-muted-foreground">
                      {ar.passed ? '✓' : '✗'} {ar.message}
                    </p>
                  ))}
                </div>
              )}

              {sr.error && (
                <p className="pl-5 text-xs text-red-500">{sr.error}</p>
              )}

              {/* Response body with copy button — was missing from history before */}
              {sr.body !== null && !sr.error && (
                <details className="pl-5">
                  <summary className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer w-fit list-none">
                    <span>Response body</span>
                    <CopyButton text={JSON.stringify(sr.body, null, 2)} />
                  </summary>
                  <pre className="mt-1 text-xs font-mono overflow-auto max-h-32 bg-muted/20 rounded p-2">
                    {JSON.stringify(sr.body, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
