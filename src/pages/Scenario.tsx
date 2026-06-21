import { useState } from 'react'
import { useScenario }   from '../hooks/useScenario'
import { useRunner }     from '../hooks/useRunner'
import { StepCard }         from '../components/scenario/StepCard'
import { StepForm }         from '../components/scenario/StepForm'
import { RunResultsPanel }  from '../components/scenario/RunResultsPanel'
import { Button }     from '@/components/ui/button'
import { Input }      from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, Square, Plus, Trash2 } from 'lucide-react'
import type { RequestStep } from '../types'

export function ScenarioPage() {
  const {
    scenarios, activeScenario, activeScenarioId,
    addScenario, removeScenario, setActiveScenario,
    addStep, updateStep, removeStep,
  } = useScenario()

  const {
    status, results, currentStepIndex, lastRun, isRunning,
    runScenario, cancelRun, runSingleStep,
  } = useRunner()

  const [newName,     setNewName]     = useState('')
  const [formOpen,    setFormOpen]    = useState(false)
  const [editingStep, setEditingStep] = useState<RequestStep | null>(null)

  const handleAddScenario = () => {
    if (!newName.trim()) return
    addScenario(newName.trim())
    setNewName('')
  }

  const handleSaveStep = (data: Omit<RequestStep, 'id'>) => {
    if (!activeScenarioId) return
    editingStep
      ? updateStep(activeScenarioId, editingStep.id, data)
      : addStep(activeScenarioId, data)
    setEditingStep(null)
  }

  return (
    <div className="flex h-full">

      {/* Col 1 — Scenario list */}
      <div className="w-52 border-r flex flex-col p-3 gap-2 shrink-0">
        <p className="text-sm font-medium">Scenarios</p>

        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {scenarios.map(s => (
              <div
                key={s.id}
                onClick={() => setActiveScenario(s.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm ${
                  activeScenarioId === s.id ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                <span className="truncate flex-1">{s.name}</span>
                <Button
                  size="icon" variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={e => { e.stopPropagation(); removeScenario(s.id) }}
                >
                  <Trash2 size={11} />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="New scenario"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddScenario()}
            className="text-sm"
          />
          <Button size="icon" variant="outline" onClick={handleAddScenario}>
            <Plus size={14} />
          </Button>
        </div>
      </div>

      {/* Col 2 — Steps */}
      <div className="flex flex-col w-80 border-r shrink-0">
        {activeScenario ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0">
              <p className="text-sm font-medium truncate flex-1">{activeScenario.name}</p>
              {isRunning ? (
                <Button size="sm" variant="destructive" onClick={cancelRun}>
                  <Square size={12} className="mr-1" />Stop
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={runScenario}
                  disabled={activeScenario.steps.length === 0}
                >
                  <Play size={12} className="mr-1" />Run
                </Button>
              )}
            </div>

            {/* Step list */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {activeScenario.steps.map((step, i) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    index={i}
                    result={results.find(r => r.stepId === step.id)}
                    isActive={isRunning && currentStepIndex === i}
                    onEdit={() => { setEditingStep(step); setFormOpen(true) }}
                    onDelete={() => removeStep(activeScenarioId!, step.id)}
                    onRunSingle={() => runSingleStep(step.id)}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Add step */}
            <div className="p-3 border-t shrink-0">
              <Button
                variant="outline" size="sm" className="w-full"
                onClick={() => { setEditingStep(null); setFormOpen(true) }}
              >
                <Plus size={14} className="mr-1" />Add Step
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Select or create a scenario
          </div>
        )}
      </div>

      {/* Col 3 — Results */}
      <div className="flex-1 overflow-hidden">
        <RunResultsPanel
          status={status}
          results={results}
          totalDuration={lastRun?.totalDuration}
        />
      </div>

      <StepForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingStep(null) }}
        onSave={handleSaveStep}
        initial={editingStep ?? undefined}
      />
    </div>
  )
}