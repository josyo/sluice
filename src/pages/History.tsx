import { useState } from 'react'
import { useHistoryStore } from '../stores/history.store'
import { Badge }      from '@/components/ui/badge'
import { Button }     from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle, XCircle, ChevronDown, ChevronRight, Clock, Trash2 } from 'lucide-react'
import type { RunResult } from '../types'

export function HistoryPage() {
  const runs         = useHistoryStore(s => s.runs)
  const clearHistory = useHistoryStore(s => s.clearHistory)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (runs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No runs yet. Execute a scenario to see history here.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <div>
          <h2 className="text-base font-semibold">Run History</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{runs.length} run{runs.length !== 1 ? 's' : ''} saved</p>
        </div>
        <Button variant="outline" size="sm" onClick={clearHistory}>
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
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function RunCard({ run, expanded, onToggle }: {
  run: RunResult; expanded: boolean; onToggle: () => void
}) {
  const passed = run.stepResults.filter(s => s.passed).length

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors text-left"
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
          {passed}/{run.stepResults.length} passed
        </Badge>
        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
          <Clock size={11} />{run.totalDuration}ms
        </span>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}