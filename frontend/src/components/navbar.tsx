import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Home" },
  { to: "/planner", label: "Plan" },
  { to: "/live", label: "Live Transit" },
  { to: "/sustainability", label: "Sustainability" },
] as const;

export function Navbar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 pt-4">
        <div className="glass-strong flex items-center justify-between rounded-2xl px-4 py-2.5 shadow-[var(--shadow-elevated)]">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
              <Sparkles className="h-5 w-5 text-[oklch(0.15_0.04_240)]" />
            </span>
            <span className="text-base font-bold tracking-tight">Namma<span className="text-gradient">Route</span></span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                path === l.to ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5",
              )}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/planner" className="hidden sm:block">
              <Button size="sm" className="rounded-full bg-[image:var(--gradient-primary)] text-[oklch(0.15_0.04_240)] hover:opacity-90">
                Plan a journey
              </Button>
            </Link>
            <button className="md:hidden grid h-9 w-9 place-items-center rounded-xl bg-white/5" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="glass mt-2 rounded-2xl p-2 md:hidden">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className={cn(
                "block rounded-xl px-3 py-2 text-sm",
                path === l.to ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
              )}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}