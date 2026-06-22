import { NavLink, Outlet } from 'react-router-dom'
import { Layers, Globe, History } from 'lucide-react'

export function AppLayout() {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <aside className="w-52 border-r flex flex-col p-3 gap-1 shrink-0">
        <div className="px-2 py-3 mb-1">
          <p className="font-bold text-base tracking-tight">Sluice</p>
          <p className="text-xs text-muted-foreground">API Scenario Runner</p>
        </div>
        <NavItem to="/scenarios"    icon={<Layers  size={15} />} label="Scenarios"    />
        <NavItem to="/environments" icon={<Globe   size={15} />} label="Environments" />
        <NavItem to="/history"      icon={<History size={15} />} label="History"      />
      </aside>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
          isActive
            ? 'bg-primary text-primary-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        }`
      }
    >
      {icon}{label}
    </NavLink>
  )
}
