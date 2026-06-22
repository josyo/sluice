import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import type { RequestStep, Assertion, Extractor, HttpMethod } from '../../types'

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

interface Props {
  open:     boolean
  onClose:  () => void
  onSave:   (step: Omit<RequestStep, 'id'>) => void
  initial?: RequestStep
}

export function StepForm({ open, onClose, onSave, initial }: Props) {
  const [name,   setName]   = useState(initial?.name   ?? '')
  const [method, setMethod] = useState<HttpMethod>(initial?.method ?? 'GET')
  const [url,    setUrl]    = useState(initial?.url    ?? '')
  const [body,   setBody]   = useState(initial?.body   ?? '')

  const [headers, setHeaders] = useState<{ key: string; value: string }[]>(
    Object.entries(initial?.headers ?? {}).map(([key, value]) => ({ key, value }))
  )
  const [assertions, setAssertions] = useState<Assertion[]>(initial?.assertions ?? [])
  const [extractors, setExtractors] = useState<Extractor[]>(initial?.extractors ?? [])

  const handleSave = () => {
    if (!name.trim() || !url.trim()) return
    onSave({
      name:   name.trim(),
      method,
      url:    url.trim(),
      headers: Object.fromEntries(
        headers.filter(h => h.key.trim()).map(h => [h.key.trim(), h.value])
      ),
      body:       body.trim() || undefined,
      assertions,
      extractors,
    })
    onClose()
  }

  // Header helpers
  const addHeader    = () => setHeaders(p => [...p, { key: '', value: '' }])
  const updateHeader = (i: number, field: 'key' | 'value', val: string) =>
    setHeaders(p => p.map((h, idx) => idx === i ? { ...h, [field]: val } : h))
  const removeHeader = (i: number) => setHeaders(p => p.filter((_, idx) => idx !== i))

  // Assertion helpers
  const addAssertion    = () =>
    setAssertions(p => [...p, { target: 'status', operator: 'eq', expected: '200' }])
  const updateAssertion = (i: number, u: Partial<Assertion>) =>
    setAssertions(p => p.map((a, idx) => idx === i ? { ...a, ...u } : a))
  const removeAssertion = (i: number) => setAssertions(p => p.filter((_, idx) => idx !== i))

  // Extractor helpers
  const addExtractor    = () => setExtractors(p => [...p, { variableName: '', path: '' }])
  const updateExtractor = (i: number, u: Partial<Extractor>) =>
    setExtractors(p => p.map((e, idx) => idx === i ? { ...e, ...u } : e))
  const removeExtractor = (i: number) => setExtractors(p => p.filter((_, idx) => idx !== i))

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Step' : 'Add Step'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto pr-1">

          {/* Name */}
          <div className="space-y-1.5">
            <Label>Step name</Label>
            <Input placeholder="e.g. Login" value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Method + URL */}
          <div className="flex gap-2">
            <Select value={method} onValueChange={v => setMethod(v as HttpMethod)}>
              <SelectTrigger className="w-28 shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                {METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              placeholder="{{baseUrl}}/endpoint"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="flex-1 font-mono text-sm"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="headers">
            <TabsList>
              <TabsTrigger value="headers">
                Headers{headers.length > 0 ? ` (${headers.length})` : ''}
              </TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="assertions">
                Assertions{assertions.length > 0 ? ` (${assertions.length})` : ''}
              </TabsTrigger>
              <TabsTrigger value="extractors">
                Extractors{extractors.length > 0 ? ` (${extractors.length})` : ''}
              </TabsTrigger>
            </TabsList>

            {/* ── Headers ── */}
            <TabsContent value="headers" className="space-y-2 pt-3">
              {headers.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Header-Name"
                    value={h.key}
                    onChange={e => updateHeader(i, 'key', e.target.value)}
                    className="w-40 font-mono text-sm"
                  />
                  <Input
                    placeholder="value or {{variable}}"
                    value={h.value}
                    onChange={e => updateHeader(i, 'value', e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                  <Button size="icon" variant="ghost" onClick={() => removeHeader(i)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addHeader}>
                <Plus size={14} className="mr-1" />Add Header
              </Button>
            </TabsContent>

            {/* ── Body ── */}
            <TabsContent value="body" className="pt-3">
              <Textarea
                placeholder={'{\n  "key": "{{variable}}"\n}'}
                value={body}
                onChange={e => setBody(e.target.value)}
                className="font-mono text-sm min-h-36 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                JSON bodies get <code className="bg-muted px-1 rounded">Content-Type: application/json</code> added automatically.
              </p>
            </TabsContent>

            {/* ── Assertions ── */}
            <TabsContent value="assertions" className="space-y-2 pt-3">
              {assertions.map((a, i) => (
                <div key={i} className="flex gap-2 items-center flex-wrap">
                  <Select
                    value={a.target}
                    onValueChange={v => updateAssertion(i, { target: v as Assertion['target'], path: undefined })}
                  >
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="status">status</SelectItem>
                      <SelectItem value="body">body</SelectItem>
                      <SelectItem value="header">header</SelectItem>
                    </SelectContent>
                  </Select>

                  {a.target !== 'status' && (
                    <Input
                      placeholder="path.to.value"
                      value={a.path ?? ''}
                      onChange={e => updateAssertion(i, { path: e.target.value })}
                      className="w-36 font-mono text-sm"
                    />
                  )}

                  <Select
                    value={a.operator}
                    onValueChange={v => updateAssertion(i, { operator: v as Assertion['operator'] })}
                  >
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['eq', 'neq', 'exists', 'contains', 'gt', 'lt'] as const).map(op => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {a.operator !== 'exists' && (
                    <Input
                      placeholder="expected value"
                      value={String(a.expected)}
                      onChange={e => updateAssertion(i, { expected: e.target.value })}
                      className="w-32 text-sm"
                    />
                  )}

                  <Button size="icon" variant="ghost" onClick={() => removeAssertion(i)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addAssertion}>
                <Plus size={14} className="mr-1" />Add Assertion
              </Button>
            </TabsContent>

            {/* ── Extractors ── */}
            <TabsContent value="extractors" className="space-y-2 pt-3">
              <p className="text-xs text-muted-foreground">
                Pull values from this response into a variable. Later steps can reference it as{' '}
                <code className="bg-muted px-1 rounded font-mono">{'{{variableName}}'}</code>
              </p>
              {extractors.map((e, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder="variableName"
                    value={e.variableName}
                    onChange={ev => updateExtractor(i, { variableName: ev.target.value })}
                    className="w-36 font-mono text-sm"
                  />
                  <span className="text-muted-foreground text-sm">←</span>
                  <Input
                    placeholder="data.token"
                    value={e.path}
                    onChange={ev => updateExtractor(i, { path: ev.target.value })}
                    className="flex-1 font-mono text-sm"
                  />
                  <Button size="icon" variant="ghost" onClick={() => removeExtractor(i)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addExtractor}>
                <Plus size={14} className="mr-1" />Add Extractor
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || !url.trim()}>
            {initial ? 'Save Changes' : 'Add Step'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
