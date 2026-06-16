import { Footprints, TrainFront, Bus, TramFront, Bike, Car, Navigation } from "lucide-react";
import type { ModeKind } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const map: Record<ModeKind, { Icon: typeof Bus; color: string; label: string }> = {
  walk: { Icon: Footprints, color: "text-muted-foreground", label: "Walk" },
  metro: { Icon: TrainFront, color: "text-[var(--brand-blue)]", label: "Metro" },
  bus: { Icon: Bus, color: "text-[var(--brand-amber)]", label: "Bus" },
  train: { Icon: TramFront, color: "text-[var(--brand-pink)]", label: "Train" },
  auto: { Icon: Navigation, color: "text-[var(--brand-amber)]", label: "Auto" },
  bike: { Icon: Bike, color: "text-[var(--brand-green)]", label: "Bike" },
  cab: { Icon: Car, color: "text-[var(--brand-cyan)]", label: "Cab" },
};

export function ModeIcon({ mode, className, withLabel = false }: { mode: ModeKind; className?: string; withLabel?: boolean }) {
  const { Icon, color, label } = map[mode];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className={cn("h-4 w-4", color)} />
      {withLabel && <span className="text-xs font-medium">{label}</span>}
    </span>
  );
}

export function modeColor(mode: ModeKind) {
  return map[mode].color;
}