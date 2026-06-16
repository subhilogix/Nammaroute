import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Brain, Leaf, Accessibility, Activity, MapPin, Sparkles, ShieldCheck, Zap, IndianRupee, Clock, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransitMap } from "@/components/transit-map";
import { stats } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NammaRoute — Smart Mobility for Every Commute" },
      { name: "description", content: "Plan multi-modal journeys across buses, metro and trains with real-time tracking, AI route optimization, and carbon-aware suggestions." },
      { property: "og:title", content: "NammaRoute — Smart Mobility" },
      { property: "og:description", content: "Real-time transit + AI route planning + last-mile in one place." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main>
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <div className="absolute inset-0 -z-10 bg-grid opacity-40" />
      <div className="mx-auto max-w-4xl px-4 pt-16 pb-20 md:pt-24 md:pb-28 text-center flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-muted-foreground animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-green)] animate-pulse-dot" />
            Live across 38 cities · Powered by transit AI
          </span>
          <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight md:text-6xl text-center">
            Every journey,<br />
            <span className="text-gradient">one intelligent plan.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg text-center">
            NammaRoute fuses real-time bus, metro and train data with multi-modal route intelligence — so you always get the fastest, cheapest and greenest way there. Including the last mile.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/planner">
              <Button size="lg" className="rounded-full bg-[image:var(--gradient-primary)] text-[oklch(0.15_0.04_240)] hover:opacity-90">
                Plan a journey <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/live">
              <Button size="lg" variant="outline" className="rounded-full border-white/15 bg-white/5 hover:bg-white/10">
                <Activity className="mr-2 h-4 w-4" /> See live transit
              </Button>
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-green)]" /> Verified GTFS feeds</span>
            <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-[var(--brand-cyan)]" /> Sub-second rerouting</span>
            <span className="inline-flex items-center gap-1.5"><Leaf className="h-3.5 w-3.5 text-[var(--brand-green)]" /> Carbon-aware routes</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-10">
      <div className="glass grid grid-cols-2 gap-4 rounded-3xl p-6 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-black md:text-3xl"><span className="text-gradient">{s.value}</span></div>
            <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

const features = [
  { Icon: Brain, title: "AI Route Optimization", body: "Multi-objective routing across time, cost, comfort and CO₂ — recomputed every few seconds." },
  { Icon: Activity, title: "Real-time Transit", body: "Live ETAs for buses, metro and trains with occupancy hints and delay forecasts." },
  { Icon: MapPin, title: "Last-mile Made Simple", body: "Walk, auto, bike or cab — seamlessly stitched into one tap-to-go journey." },
  { Icon: Leaf, title: "Greener Choices", body: "See CO₂ saved on every trip and unlock greener alternatives with one tap." },
  { Icon: Accessibility, title: "Accessibility First", body: "Wheelchair, elderly, luggage and minimal-walking filters baked into the planner." },
  { Icon: Zap, title: "Dynamic Rerouting", body: "Disruption ahead? We reroute before you even notice the delay." },
];

function Features() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold tracking-widest text-primary">CORE CAPABILITIES</span>
        <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Built like a real transit OS.</h2>
        <p className="mt-3 text-muted-foreground">Everything a daily commuter needs — and everything a city needs to move smarter.</p>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {features.map(({ Icon, title, body }) => (
          <div key={title} className="glass group relative overflow-hidden rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition group-hover:opacity-100" />
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-bold">{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const steps = [
  { Icon: MapPin, title: "Tell us where", body: "Enter origin and destination — or pick from saved places." },
  { Icon: Brain, title: "AI plans options", body: "We score thousands of route combinations in milliseconds." },
  { Icon: ArrowRight, title: "Pick your vibe", body: "Fastest, cheapest, greenest or comfiest — your call." },
  { Icon: Activity, title: "Ride with live ETAs", body: "Step-by-step guidance with real-time delays and reroutes." },
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 md:pb-28">
      <div className="glass rounded-[2rem] p-8 md:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold tracking-widest text-primary">HOW IT WORKS</span>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">From tap to terminal in four steps.</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-white/10 bg-white/5 p-5">
              <span className="absolute -top-3 left-5 grid h-7 w-7 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-xs font-black text-[oklch(0.15_0.04_240)]">{i + 1}</span>
              <s.Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <Metric Icon={Clock} label="Avg. time saved" value="17 min / trip" />
          <Metric Icon={IndianRupee} label="Avg. money saved" value="₹38 / week" />
          <Metric Icon={TrendingDown} label="CO₂ reduced" value="2.1 kg / trip" />
        </div>
      </div>
    </section>
  );
}

function Metric({ Icon, label, value }: { Icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent"><Icon className="h-4 w-4" /></span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20">
      <div className="relative overflow-hidden rounded-[2rem] p-10 md:p-16" style={{ background: "var(--gradient-primary)" }}>
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <h3 className="text-3xl font-black text-[oklch(0.15_0.04_240)] md:text-4xl">Ready to move smarter?</h3>
            <p className="mt-2 max-w-xl text-[oklch(0.15_0.04_240)]/80">Plan your next journey in seconds. No signup. No friction.</p>
          </div>
          <Link to="/planner">
            <Button size="lg" className="rounded-full bg-[oklch(0.15_0.04_240)] text-foreground hover:bg-[oklch(0.15_0.04_240)]/90">
              Start planning <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} NammaRoute · Built for a smarter, greener commute.</p>
        <p className="opacity-70">Mock data shown for demo purposes.</p>
      </div>
    </footer>
  );
}
