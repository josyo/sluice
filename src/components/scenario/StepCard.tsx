import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Play } from 'lucide-react'
import type { RequestStep, StepResult } from '../../types'

const METHOD_COLOR: Record<string, string> = {
  GET:    'bg-blue-500/10 text-blue-600',
  POST:   'bg-green-500/10 text-green-600',
  PUT:    'bg-yellow-500/10 text-yellow-600',
  PATCH:  'bg-orange-500/10 text-orange-600',
  DELETE: 'bg-red-500/10 text-red-600',
}

interface Props {
  step:        RequestStep
  index:       number
  result?:     StepResult
  isActive?:   boolean   // currently executing in a run
  onEdit:      () => void
  onDelete:    () => void
  onRunSingle: () => void
}

export function StepCard({ step, index, result, isActive, onEdit, onDelete, onRunSingle }: Props) {
  return (
    <div className="border rounded-lg p-3 space-y-1.5 bg-card">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-4 shrink-0">{index + 1}.</span>
        <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded shrink-0 ${METHOD_COLOR[step.method]}`}>
          {step.method}
        </span>
        <span className="text-sm font-medium truncate flex-1">{step.name}</span>

        {/* State: running */}
        {isActive && !result && (
          <Badge variant="outline" className="text-xs animate-pulse shrink-0">running…</Badge>
        )}

        {/* State: has result */}
        {result && (
          <Badge
            variant={result.passed ? 'default' : 'destructive'}
            className="text-xs shrink-0"
          >
            {result.status} · {result.duration}ms · {result.passed ? '✓' : '✗'}
          </Badge>
        )}

        {/* State: idle — show action buttons */}
        {!result && !isActive && (
          <div className="flex gap-0.5 shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRunSingle}>
              <Play size={12} />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
              <Pencil size={12} />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDelete}>
              <Trash2 size={12} />
            </Button>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground font-mono pl-6 truncate">{step.url}</p>

      {step.assertions.length > 0 && (
        <p className="text-xs text-muted-foreground pl-6">
          {step.assertions.length} assertion{step.assertions.length !== 1 ? 's' : ''}
          {step.extractors.length > 0 && ` · ${step.extractors.length} extractor${step.extractors.length !== 1 ? 's' : ''}`}
        </p>
      )}
    </div>
  )
}