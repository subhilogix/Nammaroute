import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Activity, Filter, RefreshCw, AlertTriangle, Info, CheckCircle2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TransitMap } from "@/components/transit-map";
import { ModeIcon } from "@/components/mode-icon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Transit Dashboard · NammaRoute" },
      { name: "description", content: "Real-time bus, metro and train ETAs, delays, occupancy and service alerts." },
    ],
  }),
  component: LivePage,
});

type ModeKind = "walk" | "metro" | "bus" | "train" | "auto" | "bike" | "cab";

interface LiveVehicle {
  id: string;
  mode: ModeKind;
  line: string;
  headsign: string;
  nextStop: string;
  stopId: string;
  etaMin: number;
  delayMin: number;
  occupancy: "low" | "medium" | "high";
  status: "on-time" | "delayed" | "diverted";
}

const stopCoordinates: Record<string, { lat: number; lon: number }> = {
  CMRL_001: { lat: 13.0827, lon: 80.2707 },
  CMRL_002: { lat: 13.0732, lon: 80.2609 },
  CMRL_003: { lat: 13.0694, lon: 80.1948 },
  CMRL_004: { lat: 13.0792, lon: 80.2738 },
  CMRL_005: { lat: 12.9815, lon: 80.2180 },
  CMRL_006: { lat: 13.0850, lon: 80.2101 },
  MTC_001: { lat: 12.9249, lon: 80.1000 },
  MTC_002: { lat: 13.0694, lon: 80.1948 },
  RAIL_001: { lat: 13.0827, lon: 80.2707 },
  RAIL_002: { lat: 12.9249, lon: 80.1000 },
};

const fallbackAlerts = [
  { id: "a1", severity: "warning" as const, title: "Metro Green Line: Delayed near Egmore", body: "Signal issue causing 5–8 min delays. Work is in progress.", time: "Just now" },
  { id: "a2", severity: "info" as const, title: "MTC Bus: Heavy congestion on Outer Ring Road", body: "MTC services running 10-15 mins behind schedules.", time: "5 min ago" },
  { id: "a3", severity: "success" as const, title: "Chennai Central: suburban rail schedules normalized", body: "Regular suburban service intervals restored.", time: "25 min ago" },
];

const modes: { id: "all" | ModeKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "metro", label: "Metro" },
  { id: "bus", label: "Bus" },
  { id: "train", label: "Suburban" },
  { id: "auto", label: "Auto" },
];

function LivePage() {
  const [q, setQ] = useState("");
  const [selectedMode, setSelectedMode] = useState<"all" | ModeKind>("all");
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("Updating...");

  const fetchFeeds = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/feeds`);
      if (!res.ok) throw new Error("Failed to load feeds");
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const mapped: LiveVehicle[] = data.map((item: any) => {
          const mode = item.mode === "rail" ? "train" : item.mode;
          const delayMin = item.details?.delay_minutes || 0;
          const status = delayMin > 0 ? "delayed" : "on-time";
          
          return {
            id: item.id,
            mode,
            line: item.route_id || item.mode.toUpperCase(),
            headsign: mode === "auto" ? "Namma Yatri Auto (Last Mile)" : `${item.route_id} Route Terminal`,
            nextStop: item.stop_name,
            stopId: item.stop_id,
            etaMin: Math.round(item.eta_minutes),
            delayMin: Math.round(delayMin),
            occupancy: item.crowding?.toLowerCase() || "low",
            status
          };
        });
        setVehicles(mapped);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn("Could not fetch feeds from backend, using sample vehicles:", err);
      // fallback mock
      setVehicles([
        { id: "MTC-B01", mode: "bus", line: "23C", headsign: "Koyambedu Bus Terminal", nextStop: "Koyambedu", stopId: "CMRL_003", etaMin: 12, delayMin: 0, occupancy: "medium", status: "on-time" },
        { id: "CMRL-T02", mode: "metro", line: "METRO_GREEN", headsign: "Green Line Terminal", nextStop: "Egmore", stopId: "CMRL_002", etaMin: 4, delayMin: 5, occupancy: "high", status: "delayed" },
        { id: "SR-S01", mode: "train", line: "RAIL_MSB", headsign: "Suburban Line Terminal", nextStop: "Chennai Central Rail", stopId: "RAIL_001", etaMin: 18, delayMin: 0, occupancy: "low", status: "on-time" },
        { id: "NY-A01", mode: "auto", line: "NAMMA_YATRI", headsign: "Namma Yatri Auto (Last Mile)", nextStop: "Velachery", stopId: "CMRL_005", etaMin: 3, delayMin: 0, occupancy: "low", status: "on-time" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
    const interval = setInterval(fetchFeeds, 8000);
    return () => clearInterval(interval);
  }, []);

  const list = useMemo(() => {
    return vehicles
      .filter((v) => (selectedMode === "all" || v.mode === selectedMode))
      .filter((v) => {
        const s = q.toLowerCase();
        return !s || v.line.toLowerCase().includes(s) || v.headsign.toLowerCase().includes(s) || v.nextStop.toLowerCase().includes(s);
      });
  }, [vehicles, q, selectedMode]);

  const stats = useMemo(() => {
    const total = vehicles.length;
    const onTime = vehicles.filter((v) => v.status === "on-time").length;
    const delayed = vehicles.filter((v) => v.status === "delayed").length;
    const highCrowd = vehicles.filter((v) => v.occupancy === "high").length;
    return { total, onTime, delayed, highCrowd };
  }, [vehicles]);

  const mappedVehiclesForMap = useMemo(() => {
    return list.map((vehicle, idx) => {
      const stopId = vehicle.stopId;
      const coords = stopCoordinates[stopId] || { lat: 13.0827, lon: 80.2707 };
      
      // Scatter vehicles slightly around the stop coordinate so they don't overlay exactly
      const angle = (idx * 2 * Math.PI) / Math.max(1, list.length);
      const radiusKm = 0.003; // ~300 meters scatter radius
      const lat = coords.lat + Math.cos(angle) * (radiusKm / 111.32);
      const lon = coords.lon + Math.sin(angle) * (radiusKm / (111.32 * Math.cos(coords.lat * Math.PI / 180)));

      return {
        lat,
        lon,
        mode: vehicle.mode,
        label: vehicle.line
      };
    });
  }, [list]);

  // Dynamically map standard stop nodes onto live dashboard map
  const stopsForMap = useMemo(() => {
    return Object.entries(stopCoordinates).map(([id, coord]) => ({
      lat: coord.lat,
      lon: coord.lon,
      label: id.split("_")[1] || id,
      type: id === "CMRL_001" ? "origin" as const : id === "CMRL_005" ? "destination" as const : undefined
    }));
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-green)] animate-pulse-dot" /> Live · Auto-sync (8s)
          </span>
          <h1 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Live transit dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track Chennai metro, buses, and suburban rails in real time.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5 animate-spin [animation-duration:5s]" /> Sync: {lastUpdated}
        </div>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI label="Vehicles tracked" value={String(stats.total)} hint="active telemetry lines" tint="text-[var(--brand-cyan)]" Icon={Activity} />
        <KPI label="On schedule" value={stats.total > 0 ? `${Math.round((stats.onTime / stats.total) * 100)}%` : "100%"} hint="normal running status" tint="text-[var(--brand-green)]" Icon={CheckCircle2} />
        <KPI label="Active Delays" value={String(stats.delayed)} hint="delays reported" tint="text-[var(--brand-amber)]" Icon={AlertTriangle} />
        <KPI label="High Occupancy" value={String(stats.highCrowd)} hint="heavy load warnings" tint="text-[var(--brand-pink)]" Icon={Users} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <TransitMap className="h-[360px]" vehicles={mappedVehiclesForMap} stops={stopsForMap} showLegend />

          <div className="mt-5 glass rounded-3xl p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search line, stop or route..." className="h-11 rounded-2xl border-white/10 bg-white/5 pl-10" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
                <Filter className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
                {modes.map((m) => (
                  <button key={m.id} onClick={() => setSelectedMode(m.id)} className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-medium capitalize",
                    selectedMode === m.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
                  )}>{m.label}</button>
                ))}
              </div>
            </div>

            <div className="mt-4 divide-y divide-white/5">
              {list.length === 0 ? (
                <EmptyState />
              ) : list.map((v) => <VehicleRow key={v.id} v={v} />)}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="glass rounded-3xl p-5">
            <h3 className="text-sm font-bold">Service alerts</h3>
            <div className="mt-3 space-y-2">
              {fallbackAlerts.map((a) => (
                <div key={a.id} className={cn(
                  "rounded-2xl border p-3",
                  a.severity === "warning" && "border-[var(--brand-amber)]/30 bg-[var(--brand-amber)]/10",
                  a.severity === "info" && "border-[var(--brand-cyan)]/30 bg-[var(--brand-cyan)]/10",
                  a.severity === "success" && "border-[var(--brand-green)]/30 bg-[var(--brand-green)]/10",
                )}>
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.body}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{a.time}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <h3 className="text-sm font-bold">Network pulse</h3>
            <div className="mt-3 space-y-3 text-sm">
              {[
                { line: "Metro Green Line", load: 68, status: "Moderate crowd" },
                { line: "Metro Blue Line", load: 45, status: "Normal crowd" },
                { line: "MTC Bus Corridors", load: 88, status: "Peak traffic delays" },
                { line: "Suburban Railways", load: 55, status: "On-time" },
              ].map((p) => (
                <div key={p.line}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{p.line}</span>
                    <span className="text-muted-foreground">{p.status}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-[image:var(--gradient-primary)]" style={{ width: `${p.load}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function KPI({ label, value, hint, tint, Icon }: { label: string; value: string; hint: string; tint: string; Icon: typeof Activity }) {
  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={cn("h-4 w-4", tint)} />
      </div>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function VehicleRow({ v }: { v: LiveVehicle }) {
  const statusTint =
    v.status === "on-time" ? "text-[var(--brand-green)] bg-[var(--brand-green)]/10" :
    v.status === "delayed" ? "text-[var(--brand-amber)] bg-[var(--brand-amber)]/10" :
    "text-[var(--brand-pink)] bg-[var(--brand-pink)]/10";
  const occTint =
    v.occupancy === "low" ? "text-[var(--brand-green)]" :
    v.occupancy === "medium" ? "text-[var(--brand-amber)]" :
    "text-[var(--brand-pink)]";
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5"><ModeIcon mode={v.mode} /></span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider">{v.line}</span>
            <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize", statusTint)}>{v.status}{v.delayMin ? ` +${v.delayMin}m` : ""}</span>
          </div>
          <p className="mt-0.5 truncate text-sm font-semibold">{v.headsign}</p>
          <p className="truncate text-xs text-muted-foreground">Next Stop: {v.nextStop} · <span className={cn("inline-flex items-center gap-1", occTint)}><Users className="h-3 w-3" /> {v.occupancy}</span></p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-lg font-black"><span className="text-gradient">{v.etaMin}</span><span className="ml-0.5 text-xs text-muted-foreground">min</span></p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">ETA</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-10 text-center text-sm text-muted-foreground">
      <Search className="mx-auto mb-2 h-5 w-5" />
      No vehicles match your filters.
    </div>
  );
}