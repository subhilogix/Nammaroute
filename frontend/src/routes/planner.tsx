import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { MapPin, Navigation, ArrowDownUp, Clock, IndianRupee, Leaf, Sparkles, Accessibility, Briefcase, Heart, Footprints, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TransitMap } from "@/components/transit-map";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Plan a Journey · NammaRoute" },
      { name: "description", content: "Multi-modal journey planner with AI-optimized routes across metro, bus and last-mile options." },
    ],
  }),
  component: PlannerPage,
});

type Pref = "fastest" | "cheapest" | "greenest" | "comfort";
const prefs: { id: Pref; Icon: typeof Clock; label: string; hint: string }[] = [
  { id: "fastest", Icon: Clock, label: "Fastest", hint: "Min. travel time" },
  { id: "cheapest", Icon: IndianRupee, label: "Cheapest", hint: "Lowest fare" },
  { id: "greenest", Icon: Leaf, label: "Greenest", hint: "Lowest CO₂" },
  { id: "comfort", Icon: Heart, label: "Comfort", hint: "Fewer transfers" },
];

interface Stop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  mode: string;
}

const fallbackStops: Stop[] = [
  { id: "CMRL_001", name: "Chennai Central", lat: 13.0827, lon: 80.2707, mode: "metro" },
  { id: "CMRL_002", name: "Egmore", lat: 13.0732, lon: 80.2609, mode: "metro" },
  { id: "CMRL_003", name: "Koyambedu", lat: 13.0694, lon: 80.1948, mode: "metro" },
  { id: "CMRL_004", name: "Park Town", lat: 13.0792, lon: 80.2738, mode: "metro" },
  { id: "CMRL_005", name: "Velachery", lat: 12.9815, lon: 80.2180, mode: "metro" },
  { id: "CMRL_006", name: "Anna Nagar", lat: 13.0850, lon: 80.2101, mode: "metro" },
  { id: "MTC_001", name: "Tambaram Bus Terminal", lat: 12.9249, lon: 80.1000, mode: "bus" },
  { id: "MTC_002", name: "Koyambedu Bus Stand", lat: 13.0694, lon: 80.1948, mode: "bus" },
  { id: "RAIL_001", name: "Chennai Central Rail", lat: 13.0827, lon: 80.2707, mode: "rail" },
  { id: "RAIL_002", name: "Tambaram Rail", lat: 12.9249, lon: 80.1000, mode: "rail" }
];

function PlannerPage() {
  const navigate = useNavigate();
  const [stops, setStops] = useState<Stop[]>(fallbackStops);
  const [from, setFrom] = useState("CMRL_001");
  const [to, setTo] = useState("CMRL_003");
  const [pref, setPref] = useState<Pref>("fastest");
  const [a11y, setA11y] = useState({ wheelchair: false, elderly: false, luggage: false, minWalk: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStops = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/stops`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setStops(data);
          }
        }
      } catch (err) {
        console.warn("Could not fetch stops from backend, using fallbacks:", err);
      }
    };
    fetchStops();
  }, []);

  const swap = () => { setFrom(to); setTo(from); };

  const submit = () => {
    if (!from || !to) {
      toast.error("Please select both source and destination");
      return;
    }
    if (from === to) {
      toast.error("Source and destination cannot be the same");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate({ to: "/results", search: { from, to, pref } });
    }, 900);
  };

  // Map chosen stops for the Leaflet map view
  const mapStops = useMemo(() => {
    const fromStop = stops.find((s) => s.id === from);
    const toStop = stops.find((s) => s.id === to);
    if (!fromStop || !toStop) return [];
    
    return [
      { lat: fromStop.lat, lon: fromStop.lon, label: fromStop.name, type: "origin" as const },
      { lat: toStop.lat, lon: toStop.lon, label: toStop.name, type: "destination" as const }
    ];
  }, [stops, from, to]);

  const savedPlaces = [
    { name: "Chennai Central", address: "Central Metro/Suburban Station", id: "CMRL_001" },
    { name: "Velachery Station", address: "Velachery CMRL Metro stop", id: "CMRL_005" },
    { name: "Tambaram Terminal", address: "Tambaram Bus / Rail Junction", id: "MTC_001" },
  ];

  const popularDestinations = [
    { name: "Koyambedu", id: "CMRL_003" },
    { name: "Egmore", id: "CMRL_002" },
    { name: "Anna Nagar", id: "CMRL_006" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <section className="glass-strong rounded-3xl p-6 shadow-[var(--shadow-elevated)]">
          <h1 className="text-2xl font-black tracking-tight">Plan a journey</h1>
          <p className="mt-1 text-sm text-muted-foreground">AI picks the best multi-modal route in seconds.</p>
 
          <div className="mt-6 space-y-3">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-green)] z-10" />
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="flex h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-foreground cursor-pointer"
              >
                {stops.map((stop) => (
                  <option key={stop.id} value={stop.id} className="bg-[oklch(0.18_0.03_250)] text-foreground">
                    {stop.name} ({stop.mode.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-pink)] z-10" />
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="flex h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-8 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-foreground cursor-pointer"
              >
                {stops.map((stop) => (
                  <option key={stop.id} value={stop.id} className="bg-[oklch(0.18_0.03_250)] text-foreground">
                    {stop.name} ({stop.mode.toUpperCase()})
                  </option>
                ))}
              </select>
              <button onClick={swap} aria-label="Swap" className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl bg-white/5 hover:bg-white/10 z-10">
                <ArrowDownUp className="h-4 w-4" />
              </button>
            </div>
          </div>
 
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Optimize for</p>
            <div className="grid grid-cols-2 gap-2">
              {prefs.map((p) => (
                <button key={p.id} onClick={() => setPref(p.id)} className={cn(
                  "group flex items-start gap-3 rounded-2xl border p-3 text-left transition",
                  pref === p.id ? "border-primary/50 bg-primary/10" : "border-white/10 bg-white/5 hover:bg-white/10",
                )}>
                  <span className={cn("grid h-9 w-9 place-items-center rounded-xl", pref === p.id ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground")}>
                    <p.Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{p.label}</span>
                    <span className="block text-xs text-muted-foreground">{p.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
 
          <div className="mt-5">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Accessibility className="h-3.5 w-3.5" /> Accessibility & comfort
            </p>
            <div className="grid gap-2">
              <Toggle Icon={Accessibility} label="Wheelchair-friendly" value={a11y.wheelchair} onChange={(v) => setA11y({ ...a11y, wheelchair: v })} />
              <Toggle Icon={Heart} label="Elderly-friendly" value={a11y.elderly} onChange={(v) => setA11y({ ...a11y, elderly: v })} />
              <Toggle Icon={Briefcase} label="Luggage-friendly" value={a11y.luggage} onChange={(v) => setA11y({ ...a11y, luggage: v })} />
              <Toggle Icon={Footprints} label="Minimal walking" value={a11y.minWalk} onChange={(v) => setA11y({ ...a11y, minWalk: v })} />
            </div>
          </div>
 
          <Button onClick={submit} disabled={loading} size="lg" className="mt-6 h-12 w-full rounded-2xl bg-[image:var(--gradient-primary)] text-[oklch(0.15_0.04_240)] hover:opacity-90">
            {loading ? (
              <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 animate-pulse" /> Generating routes…</span>
            ) : (
              <span className="inline-flex items-center gap-2"><Search className="h-4 w-4" /> Find best route</span>
            )}
          </Button>
        </section>
 
        <section className="space-y-4">
          <TransitMap className="h-[420px] md:h-[460px]" stops={mapStops.length > 0 ? mapStops : undefined} />
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Saved places">
              <div className="mt-3 space-y-2">
                {savedPlaces.map((p) => (
                  <button key={p.name} onClick={() => setTo(p.id)} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left hover:bg-white/10">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary"><MapPin className="h-4 w-4" /></span>
                    <span>
                      <span className="block text-sm font-semibold">{p.name}</span>
                      <span className="block text-xs text-muted-foreground">{p.address}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Card>
            <Card title="Popular nearby">
              <div className="mt-3 flex flex-wrap gap-2">
                {popularDestinations.map((d) => (
                  <button key={d.id} onClick={() => setTo(d.id)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground">
                    {d.name}
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/10 p-3 text-xs text-accent-foreground">
                <span className="font-semibold text-accent">Tip:</span> <span className="text-muted-foreground">Try “Greenest” to see how much CO₂ you can save today.</span>
              </div>
            </Card>
          </div>
        </section>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Don't know where to start? <Link to="/live" className="text-primary underline-offset-4 hover:underline">See live transit near you →</Link>
      </p>
    </main>
  );
}

function Toggle({ Icon, label, value, onChange }: { Icon: typeof Heart; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
      <span className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5"><Icon className="h-4 w-4 text-muted-foreground" /></span>
        <span className="text-sm">{label}</span>
      </span>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-5">
      <h3 className="text-sm font-bold">{title}</h3>
      {children}
    </div>
  );
}