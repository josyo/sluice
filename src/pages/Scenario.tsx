import { useEffect, useState } from 'react'
import { useScenario }        from '../hooks/useScenario'
import { useRunner }          from '../hooks/useRunner'
import { useEnvironment }     from '../hooks/useEnvironment'
import { StepCard }           from '../components/scenario/StepCard'
import { StepForm }           from '../components/scenario/StepForm'
import { RunResultsPanel }    from '../components/scenario/RunResultsPanel'
import { WelcomeState }       from '../components/layout/WelcomeState'
import { Button }     from '@/components/ui/button'
import { Input }      from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, Square, Plus, Trash2, Globe, AlertTriangle } from 'lucide-react'
import type { RequestStep } from '../types'

export function ScenarioPage() {
  const {
    scenarios, activeScenario, activeScenarioId,
    addScenario, removeScenario, setActiveScenario,
    addStep, updateStep, removeStep, reorderSteps,
  } = useScenario()

  const {
    status, results, currentStepIndex, lastRun, isRunning,
    runScenario, cancelRun, runSingleStep, clearResults,
  } = useRunner()

  const { activeEnvironment } = useEnvironment()

  const [newName,     setNewName]     = useState('')
  const [formOpen,    setFormOpen]    = useState(false)
  const [editingStep, setEditingStep] = useState<RequestStep | null>(null)

  // Clear stale results whenever the user switches to a different scenario
  useEffect(() => {
    clearResults()
  }, [activeScenarioId]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleDeleteScenario = (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    removeScenario(id)
  }

  const handleDeleteStep = (stepId: string, stepName: string) => {
    if (!activeScenarioId) return
    if (!window.confirm(`Delete step "${stepName}"?`)) return
    removeStep(activeScenarioId, stepId)
  }

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (!activeScenario || !activeScenarioId) return
    const steps = [...activeScenario.steps]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= steps.length) return
    ;[steps[index], steps[target]] = [steps[target], steps[index]]
    reorderSteps(activeScenarioId, steps)
  }

  return (
    <div className="flex h-full">

      {/* ── Welcome state ── shown when no scenarios exist yet */}
      {scenarios.length === 0 ? (
        <div className="flex-1">
          <WelcomeState onCreateScenario={() => addScenario('My first scenario')} />
        </div>
      ) : (
        <>
          {/* ── Col 1: Scenario list ── */}
          <div className="w-52 border-r flex flex-col p-3 gap-2 shrink-0">
            <p className="text-sm font-medium px-1">Scenarios</p>

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
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.steps.length} step{s.steps.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Button
                      size="icon" variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                      onClick={e => { e.stopPropagation(); handleDeleteScenario(s.id, s.name) }}
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

          {/* ── Col 2: Steps ── */}
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

                {/* Active environment indicator */}
                {activeEnvironment ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/30 border-b shrink-0">
                    <Globe size={11} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Env: <span className="text-foreground font-medium">{activeEnvironment.name}</span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border-b shrink-0">
                    <AlertTriangle size={11} className="text-yellow-500" />
                    <span className="text-xs text-yellow-500">No environment selected</span>
                  </div>
                )}

                {/* Step list */}
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-2">
                    {activeScenario.steps.map((step, i) => (
                      <StepCard
                        key={step.id}
                        step={step}
                        index={i}
                        totalSteps={activeScenario.steps.length}
                        result={results.find(r => r.stepId === step.id)}
                        isActive={isRunning && currentStepIndex === i}
                        onEdit={() => { setEditingStep(step); setFormOpen(true) }}
                        onDelete={() => handleDeleteStep(step.id, step.name)}
                        onRunSingle={() => runSingleStep(step.id)}
                        onMoveUp={() => handleMoveStep(i, 'up')}
                        onMoveDown={() => handleMoveStep(i, 'down')}
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
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-6">
                <p className="text-sm font-medium">Select a scenario</p>
                <p className="text-xs text-muted-foreground">Pick one from the left or create a new one</p>
              </div>
            )}
          </div>

          {/* ── Col 3: Results ── */}
          <div className="flex-1 overflow-hidden">
            <RunResultsPanel
              status={status}
              results={results}
              totalDuration={lastRun?.totalDuration}
            />
          </div>
        </>
      )}

      {/*
        key prop is the StepForm state reset fix:
        When editingStep changes (different step or null for "new"), React sees a new key,
        unmounts the old form, and mounts a fresh one — all useState initializers run again.
        Without this, the form shows stale values from the previous open.
      */}
      <StepForm
        key={editingStep?.id ?? 'new'}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingStep(null) }}
        onSave={handleSaveStep}
        initial={editingStep ?? undefined}
      />
    </div>
  )
}
