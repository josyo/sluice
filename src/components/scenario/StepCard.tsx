import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Play, ChevronUp, ChevronDown } from 'lucide-react'
import type { RequestStep, StepResult } from '../../types'

const METHOD_COLOR: Record<string, string> = {
  GET:    'bg-blue-500/10 text-blue-400',
  POST:   'bg-green-500/10 text-green-400',
  PUT:    'bg-yellow-500/10 text-yellow-400',
  PATCH:  'bg-orange-500/10 text-orange-400',
  DELETE: 'bg-red-500/10 text-red-400',
}

interface Props {
  step:        RequestStep
  index:       number
  totalSteps:  number
  result?:     StepResult
  isActive?:   boolean
  onEdit:      () => void
  onDelete:    () => void
  onRunSingle: () => void
  onMoveUp:    () => void
  onMoveDown:  () => void
}

export function StepCard({
  step, index, totalSteps, result, isActive,
  onEdit, onDelete, onRunSingle, onMoveUp, onMoveDown,
}: Props) {
  const isIdle = !result && !isActive

  return (
    <div className="border rounded-lg p-3 space-y-1.5 bg-card">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-4 shrink-0">{index + 1}.</span>

        <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded shrink-0 ${METHOD_COLOR[step.method]}`}>
          {step.method}
        </span>

        <span className="text-sm font-medium truncate flex-1">{step.name}</span>

        {isActive && !result && (
          <Badge variant="outline" className="text-xs animate-pulse shrink-0">running…</Badge>
        )}

        {result && (
          <Badge variant={result.passed ? 'default' : 'destructive'} className="text-xs shrink-0">
            {result.status} · {result.duration}ms · {result.passed ? '✓' : '✗'}
          </Badge>
        )}

        {isIdle && (
          <div className="flex gap-0.5 shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRunSingle} title="Run this step">
              <Play size={12} />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onMoveUp} disabled={index === 0} title="Move up">
              <ChevronUp size={12} />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onMoveDown} disabled={index === totalSteps - 1} title="Move down">
              <ChevronDown size={12} />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit} title="Edit step">
              <Pencil size={12} />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDelete} title="Delete step">
              <Trash2 size={12} />
            </Button>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground font-mono pl-6 truncate">{step.url}</p>

      {(step.assertions.length > 0 || step.extractors.length > 0) && (
        <p className="text-xs text-muted-foreground pl-6">
          {step.assertions.length > 0 && `${step.assertions.length} assertion${step.assertions.length !== 1 ? 's' : ''}`}
          {step.assertions.length > 0 && step.extractors.length > 0 && ' · '}
          {step.extractors.length > 0 && `${step.extractors.length} extractor${step.extractors.length !== 1 ? 's' : ''}`}
        </p>
      )}
    </div>
  )
}
