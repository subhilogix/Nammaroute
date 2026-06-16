import { useEffect, useRef, useState } from "react";

interface Stop {
  lat: number;
  lon: number;
  label: string;
  type?: "origin" | "transfer" | "destination";
}

interface Vehicle {
  lat: number;
  lon: number;
  mode: string;
  label?: string;
}

interface Props {
  stops?: Stop[];
  vehicles?: Vehicle[];
  className?: string;
  showLegend?: boolean;
}

const defaultStops: Stop[] = [
  { lat: 13.0827, lon: 80.2707, label: "Chennai Central", type: "origin" },
  { lat: 13.0732, lon: 80.2609, label: "Egmore", type: "transfer" },
  { lat: 13.0694, lon: 80.1948, label: "Koyambedu", type: "transfer" },
  { lat: 13.0792, lon: 80.2738, label: "Park Town", type: "transfer" },
  { lat: 12.9815, lon: 80.2180, label: "Velachery", type: "destination" },
];

export function TransitMap({ stops = defaultStops, vehicles = [], className, showLegend = true }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const stopsLayerRef = useRef<any>(null);
  const vehiclesLayerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const [tick, setTick] = useState(0);

  const triggerUpdate = () => setTick((t) => t + 1);

  // Initialize map once
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let mapInstance: any;

    const init = async () => {
      const L = await import("leaflet");
      if (mapRef.current) return;

      if (!mapContainerRef.current) return;

      mapInstance = L.map(mapContainerRef.current, {
        center: [13.0427, 80.2207], // Center on Chennai
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(mapInstance);

      stopsLayerRef.current = L.layerGroup().addTo(mapInstance);
      vehiclesLayerRef.current = L.layerGroup().addTo(mapInstance);
      polylineRef.current = L.polyline([], {
        color: "oklch(0.78 0.18 200)",
        weight: 4,
        opacity: 0.85,
        dashArray: "8, 6",
      }).addTo(mapInstance);

      mapRef.current = mapInstance;
      triggerUpdate();
    };

    init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map contents when stops, vehicles, or map instance updates
  useEffect(() => {
    if (!mapRef.current) return;

    const updateLayers = async () => {
      const L = await import("leaflet");
      const map = mapRef.current;
      const stopsLayer = stopsLayerRef.current;
      const vehiclesLayer = vehiclesLayerRef.current;
      const polyline = polylineRef.current;

      stopsLayer.clearLayers();
      vehiclesLayer.clearLayers();

      const bounds: any[] = [];

      // 1. Plot stops
      stops.forEach((stop) => {
        if (!stop.lat || !stop.lon) return;
        bounds.push([stop.lat, stop.lon]);

        const color =
          stop.type === "origin" ? "var(--brand-green)" :
          stop.type === "destination" ? "var(--brand-pink)" :
          stop.type === "transfer" ? "var(--brand-amber)" :
          "var(--brand-cyan)";

        const stopIcon = L.divIcon({
          className: "custom-stop-marker",
          html: `<div style="
            width: 12px;
            height: 12px;
            background-color: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 10px ${color};
          "></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });

        L.marker([stop.lat, stop.lon], { icon: stopIcon })
          .bindTooltip(stop.label, { permanent: true, direction: "top", className: "glass-tooltip font-semibold" })
          .addTo(stopsLayer);
      });

      // 2. Plot vehicles
      vehicles.forEach((v) => {
        if (!v.lat || !v.lon) return;
        bounds.push([v.lat, v.lon]);

        const { iconHtml, bgColor } = getVehicleIcon(v.mode);

        const vehicleIcon = L.divIcon({
          className: "custom-vehicle-marker",
          html: `<div style="
            display: grid;
            place-items: center;
            width: 32px;
            height: 32px;
            background-color: ${bgColor};
            color: #111118;
            border: 2.5px solid white;
            border-radius: 50%;
            box-shadow: 0 0 12px ${bgColor};
          ">${iconHtml}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        L.marker([v.lat, v.lon], { icon: vehicleIcon })
          .bindTooltip(v.label || v.mode.toUpperCase(), { direction: "bottom", className: "glass-tooltip font-semibold" })
          .addTo(vehiclesLayer);
      });

      // 3. Connect path with polyline
      if (stops.length >= 2) {
        const points = stops.map(s => [s.lat, s.lon]);
        polyline.setLatLngs(points);
      } else {
        polyline.setLatLngs([]);
      }

      // 4. Auto adjust fit bounds
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    };

    updateLayers();
  }, [stops, vehicles, tick]);

  return (
    <div className={"relative overflow-hidden rounded-3xl border border-white/10 shadow-[var(--shadow-elevated)] " + (className ?? "")}>
      <div ref={mapContainerRef} className="h-full w-full" style={{ minHeight: "300px" }} />

      {showLegend && (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 text-xs z-[1000]">
          <div className="glass-strong rounded-full px-3 py-1.5 flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--brand-green)]" /> Origin</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--brand-amber)]" /> Transfer</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--brand-pink)]" /> Destination</span>
          </div>
          <div className="glass-strong rounded-full px-3 py-1.5 flex items-center gap-2 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-[var(--brand-cyan)] animate-pulse-dot" />
            Live tracking active
          </div>
        </div>
      )}
    </div>
  );
}

function getVehicleIcon(mode: string) {
  // Lucide SVG code strings
  const busSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 .6.4 1 1 1h1"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/></svg>`;
  const trainSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 11h16"/><path d="M8 15h.01"/><path d="M16 15h.01"/><path d="m6 21 2-4"/><path d="m18 21-2-4"/></svg>`;
  const autoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 .6.4 1 1 1h1"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/></svg>`;
  const walkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="1"/><path d="m18 20-4-4V9c0-.6-.4-1-1-1H9c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h2v5"/></svg>`;

  if (mode === "bus") {
    return { iconHtml: busSvg, bgColor: "var(--brand-amber)" };
  } else if (mode === "metro" || mode === "train") {
    return { iconHtml: trainSvg, bgColor: "var(--brand-cyan)" };
  } else if (mode === "auto") {
    // Custom auto (three-wheeler) representation in SVG or nice Lucide cab/taxi outline
    const taxiSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2v2"/><path d="M10 2v2"/><path d="M3 14h18"/><path d="M18 10h-2V6a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v4H6a4 4 0 0 0-4 4v2c0 .6.4 1 1 1h1m12 0h-8"/><circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/></svg>`;
    return { iconHtml: taxiSvg, bgColor: "var(--brand-pink)" };
  } else {
    return { iconHtml: walkSvg, bgColor: "var(--brand-green)" };
  }
}