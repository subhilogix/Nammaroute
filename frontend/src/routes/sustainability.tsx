import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, TreePine, Car, Bus, TrainFront, Bike, Footprints, TrendingDown, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sustainability")({
  head: () => ({
    meta: [
      { title: "Sustainability · NammaRoute" },
      { name: "description", content: "See how multi-modal public transport reduces your carbon footprint vs. driving solo." },
    ],
  }),
  component: SustainPage,
});

const modes = [
  { Icon: Footprints, label: "Walk", co2: 0, color: "var(--brand-green)" },
  { Icon: Bike, label: "Bike", co2: 5, color: "var(--brand-green)" },
  { Icon: TrainFront, label: "Metro", co2: 28, color: "var(--brand-cyan)" },
  { Icon: Bus, label: "Bus", co2: 68, color: "var(--brand-amber)" },
  { Icon: Car, label: "Car (solo)", co2: 192, color: "var(--brand-pink)" },
];

const max = Math.max(...modes.map((m) => m.co2));

function SustainPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <header className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
          <Leaf className="h-3.5 w-3.5 text-[var(--brand-green)]" /> Sustainability impact
        </span>
        <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
          Every smart trip is a <span className="text-gradient">smaller footprint.</span>
        </h1>
        <p className="mt-3 text-muted-foreground">See exactly how much CO₂ you save by choosing public and shared transport — and watch your impact compound.</p>
      </header>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <Impact Icon={TrendingDown} value="14.2 kg" label="CO₂ saved this month" />
        <Impact Icon={TreePine} value="0.6 trees" label="Equivalent absorbed" />
        <Impact Icon={Award} value="Top 8%" label="Greener than peers" />
      </section>

      <section className="mt-10 glass rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">CO₂ per km, by mode</h2>
            <p className="text-sm text-muted-foreground">Estimated grams of CO₂ per passenger-km.</p>
          </div>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted-foreground">Lower is better</span>
        </div>
        <div className="mt-6 space-y-4">
          {modes.map((m) => (
            <div key={m.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 font-semibold">
                  <m.Icon className="h-4 w-4" style={{ color: m.color }} />
                  {m.label}
                </span>
                <span className="text-muted-foreground">{m.co2} g/km</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full" style={{ width: `${(m.co2 / max) * 100}%`, background: `linear-gradient(90deg, ${m.color}, color-mix(in oklab, ${m.color} 50%, white))` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <h3 className="text-lg font-black">Your weekly impact</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              { icon: "🚇", text: "12 metro trips", co2: "saved 2.4 kg CO₂" },
              { icon: "🚌", text: "8 bus rides", co2: "saved 1.6 kg CO₂" },
              { icon: "🚶", text: "Walked 6.4 km", co2: "burned 320 kcal · 0 emissions" },
              { icon: "🌳", text: "Equivalent", co2: "0.18 trees absorbing for a year" },
            ].map((r) => (
              <li key={r.text} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
                <span className="flex items-center gap-2"><span className="text-base">{r.icon}</span> {r.text}</span>
                <span className="text-xs text-[var(--brand-green)]">{r.co2}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass relative overflow-hidden rounded-3xl p-6">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[var(--brand-green)]/20 blur-3xl" />
          <h3 className="text-lg font-black">Greener route, one tap away</h3>
          <p className="mt-1 text-sm text-muted-foreground">Try the “Greenest” preset in the planner — most trips save 60–80% CO₂ vs. driving solo.</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center gap-2"><Leaf className="h-4 w-4 text-[var(--brand-green)]" /> Carbon-aware multi-modal routing</li>
            <li className="flex items-center gap-2"><Leaf className="h-4 w-4 text-[var(--brand-green)]" /> Walk + transit combinations</li>
            <li className="flex items-center gap-2"><Leaf className="h-4 w-4 text-[var(--brand-green)]" /> Shared & micro-mobility for last mile</li>
          </ul>
          <Link to="/planner" className="mt-5 inline-block">
            <Button className="rounded-full bg-[image:var(--gradient-primary)] text-[oklch(0.15_0.04_240)] hover:opacity-90">
              Plan a greener trip <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

function Impact({ Icon, value, label }: { Icon: typeof Leaf; value: string; label: string }) {
  return (
    <div className="glass rounded-3xl p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--brand-green)]/15 text-[var(--brand-green)]">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-black"><span className="text-gradient">{value}</span></p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}