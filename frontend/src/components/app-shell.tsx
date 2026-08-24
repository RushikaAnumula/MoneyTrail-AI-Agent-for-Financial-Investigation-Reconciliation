import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  TriangleAlert,
  Settings as SettingsIcon,
  Menu,
  X,
  Search,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/exceptions", label: "Exceptions", icon: TriangleAlert },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {nav.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{
            className:
              "!bg-sidebar-accent !text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--sidebar-primary)]",
          }}
        >
          <Icon className="size-4 shrink-0" strokeWidth={1.75} />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-6 py-5">
      <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
        <span className="text-sm font-bold">M</span>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">MoneyTrail</div>
        <div className="text-[11px] text-muted-foreground">AI Finance Controller</div>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Brand />
        <NavLinks />
        <div className="mt-auto border-t border-sidebar-border p-4">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3">
            <p className="label-caps">Environment</p>
            <p className="mt-1 text-sm font-medium">Production ledger</p>
            <p className="text-xs text-muted-foreground">Synced 12 min ago</p>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button
              className="lg:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            <div className="relative hidden max-w-sm flex-1 sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search transaction or exception ID"
                className="h-9 w-full rounded-md border border-input bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
              />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button aria-label="Notifications" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="size-5" strokeWidth={1.75} />
                <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-destructive" />
              </button>
              <div className="flex items-center gap-2 border-l border-border pl-3">
                <div className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold">
                  RA
                </div>
                <div className="hidden leading-tight sm:block">
                  <div className="text-xs font-medium">Rushika A.</div>
                  <div className="text-[11px] text-muted-foreground">Controller</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className={cn("mx-auto max-w-[1400px]")}>
            <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
