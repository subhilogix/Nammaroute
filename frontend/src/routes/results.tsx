import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, IndianRupee, Leaf, Heart, ArrowRight, Repeat, Footprints, AlertTriangle, Sparkles, Zap, Bell, Bookmark, Share2, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransitMap } from "@/components/transit-map";
import { sampleRoutes, type RouteOption, type Leg } from "@/lib/mock-data";
import { ModeIcon } from "@/components/mode-icon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/results")({
  validateSearch: (s: Record<string, unknown>) => ({
    from: typeof s.from === "string" ? s.from : "CMRL_001",
    to: typeof s.to === "string" ? s.to : "CMRL_003",
    pref: typeof s.pref === "string" ? s.pref : "fastest",
  }),
  head: () => ({
    meta: [
      { title: "Route Results · NammaRoute" },
      { name: "description", content: "AI-optimized multi-modal route options with live ETAs, carbon footprint and comfort scores." },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { from, to, pref } = Route.useSearch();
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [rerouted, setRerouted] = useState(false);

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const url = `${apiUrl}/route?source=${from}&destination=${to}&preference=${pref}${rerouted ? "&simulate_incident=true" : ""}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Failed to fetch routes from backend");
        }
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        const mappedRoutes = mapBackendRoutes(data.routes);
        setRoutes(mappedRoutes);
        if (mappedRoutes.length > 0) {
          setSelectedId(mappedRoutes[0].id);
        } else {
          setError("No routes found between these locations.");
        }
      } catch (err: any) {
        console.warn("Could not fetch route from backend, falling back to mock:", err);
        setError(err.message || "An error occurred while planning your route.");
        toast.error("Offline Mode: Using local simulation data.");
        
        // Fallback to sample data
        const mappedSample = orderByPref(sampleRoutes, pref);
        setRoutes(mappedSample);
        setSelectedId(mappedSample[0]?.id);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, [from, to, pref, rerouted]);

  const selected = useMemo(() => {
    return routes.find((r) => r.id === selectedId) ?? routes[0];
  }, [routes, selectedId]);

  // Map chosen route's stop coordinates directly for Leaflet
  const mapStops = useMemo(() => {
    if (!selected || !selected.legs || selected.legs.length === 0) return [];
    
    const list: any[] = [];
    const legs = selected.legs;

    // Add origin
    const firstLeg = legs[0];
    const firstCoords = (firstLeg as any).fromCoords || [13.0827, 80.2707];
    list.push({
      lat: firstCoords[0],
      lon: firstCoords[1],
      label: firstLeg.from,
      type: "origin" as const
    });

    // Add transfers
    for (let i = 0; i < legs.length - 1; i++) {
      const leg = legs[i];
      const coords = (leg as any).toCoords || [13.0732, 80.2609];
      list.push({
        lat: coords[0],
        lon: coords[1],
        label: leg.to,
        type: "transfer" as const
      });
    }

    // Add destination
    const lastLeg = legs[legs.length - 1];
    const lastCoords = (lastLeg as any).toCoords || [12.9815, 80.2180];
    list.push({
      lat: lastCoords[0],
      lon: lastCoords[1],
      label: lastLeg.to,
      type: "destination" as const
    });

    return list;
  }, [selected]);

  // Place active vehicles dynamically along route legs on the map
  const mapVehicles = useMemo(() => {
    if (!selected || !selected.legs) return [];
    return selected.legs
      .filter((l) => l.mode !== "walk")
      .map((l: any, idx) => {
        const fromC = l.fromCoords || [13.08, 80.25];
        const toC = l.toCoords || [13.07, 80.24];
        // Calculate midpoints to place vehicle markers
        const lat = (fromC[0] + toC[0]) / 2;
        const lon = (fromC[1] + toC[1]) / 2;
        return {
          lat,
          lon,
          mode: l.mode as any,
          label: l.line || l.mode.toUpperCase()
        };
      });
  }, [selected]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Route results</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl flex items-center gap-2">
            <span>{from}</span> 
            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" /> 
            <span>{to}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Optimized for <span className="text-primary capitalize">{pref}</span> · {routes.length} options</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/planner"><Button variant="outline" className="rounded-full border-white/15 bg-white/5">Edit journey</Button></Link>
          <Button variant="outline" className="rounded-full border-white/15 bg-white/5" onClick={() => toast("Journey saved", { description: "Quick-access from your dashboard." })}>
            <Bookmark className="mr-1.5 h-4 w-4" /> Save
          </Button>
        </div>
      </header>

      <DisruptionBanner rerouted={rerouted} onReroute={() => { setRerouted(true); toast.success("Rerouted via alternate lines", { description: "Dynamic backup route computed by NammaRoute." }); }} />

      {loading ? (
        <div className="mt-12 flex flex-col items-center justify-center py-20 text-muted-foreground glass rounded-[2rem]">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-lg font-bold">Computing AI Commute Paths...</p>
          <p className="text-sm">Fetching telemetry and schedule feeds from Southern Rail & CMRL</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_440px]">
          <section className="space-y-3">
            {routes.map((r) => (
              <RouteCard key={r.id} route={r} selected={r.id === selectedId} onSelect={() => setSelectedId(r.id)} />
            ))}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <TransitMap className="h-[360px]" stops={mapStops} vehicles={mapVehicles} />
            {selected && <TripDetails route={selected} />}
          </aside>
        </div>
      )}
    </main>
  );
}

function orderByPref(routes: RouteOption[], pref: string) {
  const r = [...routes];
  if (pref === "cheapest") r.sort((a, b) => a.totalCost - b.totalCost);
  else if (pref === "greenest") r.sort((a, b) => a.totalCo2g - b.totalCo2g);
  else if (pref === "comfort") r.sort((a, b) => b.comfortScore - a.comfortScore);
  else r.sort((a, b) => a.totalMin - b.totalMin);
  return r;
}

function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function mapBackendRoutes(backendRoutes: any[]): RouteOption[] {
  return backendRoutes.map((r, idx) => {
    const id = `r_${r.optimized_for}_${idx}`;
    const badges: RouteOption["badges"] = [];
    if (r.optimized_for === "time") {
      badges.push("Fastest");
      badges.push("Recommended");
    } else if (r.optimized_for === "cost") {
      badges.push("Cheapest");
    } else if (r.optimized_for === "carbon") {
      badges.push("Greenest");
    } else {
      badges.push("Comfort");
    }

    const legs: Leg[] = r.legs.map((l: any) => {
      const mode = l.mode === "rail" ? "train" : l.mode;
      const distance = getHaversineDistance(l.from_coords[0], l.from_coords[1], l.to_coords[0], l.to_coords[1]);

      return {
        mode,
        line: l.mode === "metro" ? "Metro Line" : l.mode === "rail" ? "Suburban Rail" : l.mode === "bus" ? "MTC Bus" : "Last Mile",
        from: l.from,
        to: l.to,
        durationMin: Math.round(l.time_minutes),
        distanceKm: Number(distance.toFixed(2)),
        costRupees: l.cost_rs,
        co2g: l.carbon_g,
        occupancy: l.crowding.toLowerCase() as any,
        accessibility: { wheelchair: true, elevator: l.mode === "metro" },
        etaMin: l.is_live ? Math.round(l.time_minutes) : undefined,
        fromCoords: l.from_coords,
        toCoords: l.to_coords
      };
    });

    const totalMin = Math.round(r.total_time_minutes);
    const totalCost = r.total_cost_rs;
    const totalCo2g = r.total_carbon_g;
    const transfers = Math.max(0, legs.length - 1);
    const walkMin = transfers * 3 + 2; 

    const summary = legs.map((l: any) => l.mode.toUpperCase()).join(" → ");

    return {
      id,
      badges,
      totalMin,
      totalCost,
      totalCo2g,
      comfortScore: r.optimized_for === "carbon" ? 82 : 94,
      transfers,
      walkMin,
      legs,
      summary,
      reliability: 88 + Math.floor(Math.random() * 10)
    };
  });
}

function DisruptionBanner({ rerouted, onReroute }: { rerouted: boolean; onReroute: () => void }) {
  if (rerouted) {
    return (
      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-3 text-sm">
        <Sparkles className="h-4 w-4 text-accent" />
        <span>NammaRoute AI dynamically rerouted. Transit is smooth now.</span>
      </div>
    );
  }
  return (
    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[var(--brand-amber)]/30 bg-[var(--brand-amber)]/10 p-3 text-sm md:flex-row md:items-center md:justify-between">
      <span className="inline-flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-[var(--brand-amber)]" />
        Potential delays detected on bus/suburban rail lines. Click Reroute to check alternatives.
      </span>
      <Button size="sm" onClick={onReroute} className="rounded-full bg-[var(--brand-amber)] text-[oklch(0.15_0.04_240)] hover:opacity-90">
        <Zap className="mr-1.5 h-4 w-4" /> Reroute me
      </Button>
    </div>
  );
}

function badgeStyle(b: string) {
  if (b === "Fastest") return "bg-[var(--brand-cyan)]/15 text-[var(--brand-cyan)] border-[var(--brand-cyan)]/30";
  if (b === "Cheapest") return "bg-[var(--brand-amber)]/15 text-[var(--brand-amber)] border-[var(--brand-amber)]/30";
  if (b === "Greenest") return "bg-[var(--brand-green)]/15 text-[var(--brand-green)] border-[var(--brand-green)]/30";
  if (b === "Recommended") return "bg-[image:var(--gradient-primary)] text-[oklch(0.15_0.04_240)] border-transparent";
  return "bg-[var(--brand-pink)]/15 text-[var(--brand-pink)] border-[var(--brand-pink)]/30";
}

function RouteCard({ route, selected, onSelect }: { route: RouteOption; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group block w-full overflow-hidden rounded-3xl border p-5 text-left transition",
        selected ? "border-primary/50 bg-primary/5 shadow-[var(--shadow-glow)]" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {route.badges.map((b) => (
          <span key={b} className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", badgeStyle(b))}>{b}</span>
        ))}
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-green)] animate-pulse-dot" /> Live · {route.reliability}% on-time
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat Icon={Clock} value={`${route.totalMin} min`} label="travel" tint="text-[var(--brand-cyan)]" />
        <Stat Icon={IndianRupee} value={`₹${route.totalCost}`} label="fare" tint="text-[var(--brand-amber)]" />
        <Stat Icon={Leaf} value={`${route.totalCo2g} g`} label="CO₂" tint="text-[var(--brand-green)]" />
        <Stat Icon={Heart} value={`${route.comfortScore}/100`} label="comfort" tint="text-[var(--brand-pink)]" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Repeat className="h-3.5 w-3.5" /> {route.transfers} transfer{route.transfers === 1 ? "" : "s"}</span>
        <span className="inline-flex items-center gap-1"><Footprints className="h-3.5 w-3.5" /> {route.walkMin} min walk</span>
      </div>

      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
        {route.legs.map((l, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs")}>
              <ModeIcon mode={l.mode} />
              <span className="font-semibold">{l.line ?? l.mode}</span>
              <span className="text-muted-foreground">· {l.durationMin}m</span>
            </span>
            {i < route.legs.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
        ))}
      </div>
    </button>
  );
}

function Stat({ Icon, value, label, tint }: { Icon: typeof Clock; value: string; label: string; tint: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn("grid h-9 w-9 place-items-center rounded-xl bg-white/5", tint)}><Icon className="h-4 w-4" /></span>
      <div>
        <p className="text-sm font-bold">{value}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function TripDetails({ route }: { route: RouteOption }) {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Trip timeline</h3>
        <div className="flex gap-1">
          <button onClick={() => toast("Trip shared")} className="grid h-8 w-8 place-items-center rounded-xl bg-white/5 hover:bg-white/10"><Share2 className="h-4 w-4" /></button>
          <button onClick={() => toast("Alerts enabled for this trip")} className="grid h-8 w-8 place-items-center rounded-xl bg-white/5 hover:bg-white/10"><Bell className="h-4 w-4" /></button>
        </div>
      </div>
      <ol className="mt-4 space-y-3">
        {route.legs.map((l, i) => (
          <LegRow key={i} leg={l} last={i === route.legs.length - 1} />
        ))}
      </ol>
      <Button className="mt-5 w-full rounded-2xl bg-[image:var(--gradient-primary)] text-[oklch(0.15_0.04_240)] hover:opacity-90">
        Start navigation <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

function LegRow({ leg, last }: { leg: Leg; last: boolean }) {
  return (
    <li className="relative grid grid-cols-[28px_minmax(0,1fr)] gap-3">
      <div className="relative flex flex-col items-center">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/5"><ModeIcon mode={leg.mode} /></span>
        {!last && <span className="mt-1 h-full w-px flex-1 bg-gradient-to-b from-white/20 to-transparent" />}
      </div>
      <div className="min-w-0 pb-2">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">
            {leg.line ? `${leg.line} · ` : ""}{leg.from} → {leg.to}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">{leg.durationMin} min</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span>{leg.distanceKm.toFixed(1)} km</span>
          {leg.costRupees > 0 && <span>₹{leg.costRupees}</span>}
          {leg.etaMin != null && <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-green)] animate-pulse-dot" /> ETA {leg.etaMin} min</span>}
          {leg.occupancy && <span className="capitalize">{leg.occupancy} occupancy</span>}
        </div>
      </div>
    </li>
  );
}