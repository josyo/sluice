import { Button } from '@/components/ui/button'
import { ArrowRight, Globe, Layers, Zap } from 'lucide-react'

interface Props {
  onCreateScenario: () => void
}

export function WelcomeState({ onCreateScenario }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-10">

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-muted-foreground uppercase border border-border rounded-full px-4 py-1.5">
          API Scenario Runner
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Test your entire API flow,<br />
          <span className="text-muted-foreground">not just one endpoint.</span>
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          Sluice chains HTTP requests together. Each step can extract values
          from the previous response and inject them into the next one.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        <FlowStep icon={<Globe size={16} />}  label="Environment" description="Set base URLs and tokens once" />
        <ArrowRight size={16} className="text-muted-foreground shrink-0" />
        <FlowStep icon={<Layers size={16} />} label="Scenario"    description="A named chain of requests"   />
        <ArrowRight size={16} className="text-muted-foreground shrink-0" />
        <FlowStep icon={<Zap size={16} />}    label="Run"         description="Watch each step pass or fail" />
      </div>

      <div className="w-full max-w-lg border border-border rounded-lg overflow-hidden text-left">
        <div className="px-4 py-2 border-b border-border bg-muted/20">
          <span className="text-xs font-mono text-muted-foreground">Example — Auth flow</span>
        </div>
        <div className="divide-y divide-border">
          <ExampleStep index={1} method="POST" path="/auth/login"  note='extracts → {{token}}'                    />
          <ExampleStep index={2} method="GET"  path="/users/me"    note='uses Authorization: Bearer {{token}}'    />
          <ExampleStep index={3} method="POST" path="/payments"    note='asserts status 201'                      />
        </div>
      </div>

      <Button onClick={onCreateScenario} size="lg" className="gap-2">
        Build your first scenario <ArrowRight size={16} />
      </Button>
    </div>
  )
}

function FlowStep({ icon, label, description }: { icon: React.ReactNode; label: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-36">
      <div className="w-10 h-10 rounded-lg border border-border bg-muted/30 flex items-center justify-center text-foreground">
        {icon}
      </div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground text-center">{description}</p>
    </div>
  )
}

function ExampleStep({ index, method, path, note }: { index: number; method: string; path: string; note: string }) {
  const color: Record<string, string> = { GET: 'text-blue-400', POST: 'text-green-400' }
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-xs text-muted-foreground w-4 shrink-0">{index}.</span>
      <span className={`text-xs font-mono font-bold w-10 shrink-0 ${color[method] ?? 'text-foreground'}`}>{method}</span>
      <span className="text-sm font-mono flex-1">{path}</span>
      <span className="text-xs text-muted-foreground font-mono hidden sm:block">{note}</span>
    </div>
  )
}
