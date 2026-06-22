import { useState } from 'react'
import { useEnvironment } from '../hooks/useEnvironment'
import { Button }     from '@/components/ui/button'
import { Input }      from '@/components/ui/input'
import { Badge }      from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2, Check } from 'lucide-react'

export function EnvironmentPage() {
  const {
    environments, activeEnvironment, activeEnvironmentId,
    addEnvironment, removeEnvironment, setActiveEnvironment,
    setVariable, removeVariable,
  } = useEnvironment()

  const [newEnvName, setNewEnvName] = useState('')
  const [newKey,     setNewKey]     = useState('')
  const [newValue,   setNewValue]   = useState('')

  const handleAddEnv = () => {
    if (!newEnvName.trim()) return
    addEnvironment(newEnvName.trim())
    setNewEnvName('')
  }

  const handleAddVariable = () => {
    if (!newKey.trim() || !activeEnvironmentId) return
    setVariable(activeEnvironmentId, newKey.trim(), newValue)
    setNewKey('')
    setNewValue('')
  }

  const handleDeleteEnv = (id: string, name: string) => {
    if (!window.confirm(`Delete environment "${name}"?`)) return
    removeEnvironment(id)
  }

  return (
    <div className="flex h-full">

      {/* Environment list */}
      <div className="w-52 border-r flex flex-col p-3 gap-2 shrink-0">
        <p className="text-sm font-medium">Environments</p>

        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {environments.map(env => (
              <div
                key={env.id}
                onClick={() => setActiveEnvironment(env.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm ${
                  activeEnvironmentId === env.id ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate">{env.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Object.keys(env.variables).length} var{Object.keys(env.variables).length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {activeEnvironmentId === env.id && (
                    <Check size={13} className="text-primary" />
                  )}
                  <Button
                    size="icon" variant="ghost"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100"
                    onClick={e => { e.stopPropagation(); handleDeleteEnv(env.id, env.name) }}
                  >
                    <Trash2 size={11} />
                  </Button>
                </div>
              </div>
            ))}

            {environments.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                No environments yet
              </p>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="Name"
            value={newEnvName}
            onChange={e => setNewEnvName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddEnv()}
            className="text-sm"
          />
          <Button size="icon" variant="outline" onClick={handleAddEnv}>
            <Plus size={14} />
          </Button>
        </div>
      </div>

      {/* Variables editor */}
      <div className="flex-1 overflow-auto p-6">
        {activeEnvironment ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-base font-semibold">{activeEnvironment.name}</h2>
              <Badge variant="secondary">
                {Object.keys(activeEnvironment.variables).length} variable{Object.keys(activeEnvironment.variables).length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Variable rows */}
            <div className="space-y-2 mb-4">
              {Object.keys(activeEnvironment.variables).length === 0 && (
                <p className="text-sm text-muted-foreground py-2">
                  No variables yet. Add one below — reference them in steps as{' '}
                  <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{'{{variableName}}'}</code>
                </p>
              )}
              {Object.entries(activeEnvironment.variables).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <code className="w-44 text-sm bg-muted px-3 py-2 rounded-md shrink-0 truncate">{key}</code>
                  <Input
                    value={value}
                    onChange={e => setVariable(activeEnvironment.id, key, e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    size="icon" variant="ghost"
                    onClick={() => removeVariable(activeEnvironment.id, key)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add variable */}
            <div className="flex gap-3">
              <Input
                placeholder="KEY"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                className="w-44 font-mono text-sm"
              />
              <Input
                placeholder="value or {{reference}}"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddVariable()}
                className="flex-1 font-mono text-sm"
              />
              <Button variant="outline" onClick={handleAddVariable}>
                <Plus size={14} className="mr-1" />Add
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-sm font-medium">No environment selected</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Create an environment on the left to store variables like{' '}
              <code className="font-mono bg-muted px-1 rounded">baseUrl</code> and{' '}
              <code className="font-mono bg-muted px-1 rounded">authToken</code>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
