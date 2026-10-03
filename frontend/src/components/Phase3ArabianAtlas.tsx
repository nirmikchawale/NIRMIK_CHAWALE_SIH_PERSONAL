import { useEffect, useMemo, useRef, useState } from "react";

import { api } from "../api";
import { paletteHsl } from "../palettes";
import type { ColorPalette, CurrentsVolumeResponse, VolumeResponse } from "../types";
import { displayUnits } from "../units";

type AtlasVariable = "thetao" | "so" | "currents";
type AtlasPoint = [longitude: number, latitude: number, depth: number, value: number];

interface AtlasBounds {
  west: number;
  east: number;
  south: number;
  north: number;
}

interface AtlasSector extends AtlasBounds {
  id: number;
  code: string;
  row: number;
  column: number;
  points: AtlasPoint[];
  depthCount: number;
  mean: number | null;
}

interface AtlasPayload {
  variable: AtlasVariable;
  label: string;
  units: string;
  time: string;
  minimum: number;
  maximum: number;
  points: AtlasPoint[];
}

const SECTOR_COLUMNS = 4;
const SECTOR_ROWS = 3;
const SECTOR_COUNT = SECTOR_COLUMNS * SECTOR_ROWS;

const VARIABLE_META: Record<AtlasVariable, { label: string; palette: ColorPalette }> = {
  thetao: { label: "Temperature", palette: "thermal" },
  so: { label: "Salinity", palette: "viridis" },
  currents: { label: "Current speed", palette: "icefire" }
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function sectorIdForPoint(longitude: number, latitude: number, bounds: AtlasBounds): number {
  const lonSpan = Math.max(bounds.east - bounds.west, 1e-12);
  const latSpan = Math.max(bounds.north - bounds.south, 1e-12);
  const column = clamp(Math.floor(((longitude - bounds.west) / lonSpan) * SECTOR_COLUMNS), 0, SECTOR_COLUMNS - 1);
  const southRow = clamp(Math.floor(((latitude - bounds.south) / latSpan) * SECTOR_ROWS), 0, SECTOR_ROWS - 1);
  const displayRow = SECTOR_ROWS - 1 - southRow;
  return displayRow * SECTOR_COLUMNS + column + 1;
}

function colourFor(value: number, minimum: number, maximum: number, palette: ColorPalette, alpha: number): string {
  const span = Math.max(maximum - minimum, 1e-12);
  const t = clamp((value - minimum) / span, 0, 1);
  const [hue, saturation, lightness] = paletteHsl(t, palette);
  return `hsla(${hue.toFixed(1)}, ${saturation}%, ${lightness.toFixed(1)}%, ${alpha.toFixed(3)})`;
}

function normalisePayload(variable: AtlasVariable, payload: VolumeResponse | CurrentsVolumeResponse): AtlasPayload {
  if ("points" in payload) {
    return {
      variable,
      label: payload.label,
      units: displayUnits(payload.units),
      time: payload.time,
      minimum: payload.minimum,
      maximum: payload.maximum,
      points: payload.points
    };
  }

  return {
    variable,
    label: "Current speed",
    units: displayUnits(payload.units),
    time: payload.time,
    minimum: payload.minimum,
    maximum: payload.maximum,
    points: payload.vectors.map(([longitude, latitude, depth, , , speed]) => [longitude, latitude, depth, speed])
  };
}

function buildSectors(points: AtlasPoint[]): { bounds: AtlasBounds; sectors: AtlasSector[] } | null {
  if (points.length === 0) return null;

  const longitudes = points.map((point) => point[0]);
  const latitudes = points.map((point) => point[1]);
  const bounds: AtlasBounds = {
    west: Math.min(...longitudes),
    east: Math.max(...longitudes),
    south: Math.min(...latitudes),
    north: Math.max(...latitudes)
  };
  const lonStep = Math.max(bounds.east - bounds.west, 1e-12) / SECTOR_COLUMNS;
  const latStep = Math.max(bounds.north - bounds.south, 1e-12) / SECTOR_ROWS;
  const buckets = Array.from({ length: SECTOR_COUNT }, () => [] as AtlasPoint[]);

  for (const point of points) {
    buckets[sectorIdForPoint(point[0], point[1], bounds) - 1].push(point);
  }

  const sectors: AtlasSector[] = [];
  for (let row = 0; row < SECTOR_ROWS; row += 1) {
    for (let column = 0; column < SECTOR_COLUMNS; column += 1) {
      const id = row * SECTOR_COLUMNS + column + 1;
      const southRow = SECTOR_ROWS - 1 - row;
      const sectorPoints = buckets[id - 1];
      const values = sectorPoints.map((point) => point[3]);
      sectors.push({
        id,
        code: `AS-${String(id).padStart(2, "0")}`,
        row,
        column,
        west: bounds.west + column * lonStep,
        east: column === SECTOR_COLUMNS - 1 ? bounds.east : bounds.west + (column + 1) * lonStep,
        south: bounds.south + southRow * latStep,
        north: southRow === SECTOR_ROWS - 1 ? bounds.north : bounds.south + (southRow + 1) * latStep,
        points: sectorPoints,
        depthCount: new Set(sectorPoints.map((point) => point[2])).size,
        mean: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
      });
    }
  }

  return { bounds, sectors };
}

function SectorMiniBlock({
  sector,
  minimum,
  maximum,
  palette,
  active,
  onSelect
}: {
  sector: AtlasSector;
  minimum: number;
  maximum: number;
  palette: ColorPalette;
  active: boolean;
  onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const expectedWidth = Math.round(width * dpr);
      const expectedHeight = Math.round(height * dpr);
      if (canvas.width !== expectedWidth || canvas.height !== expectedHeight) {
        canvas.width = expectedWidth;
        canvas.height = expectedHeight;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const rootStyle = getComputedStyle(document.documentElement);
      const accent = rootStyle.getPropertyValue("--glass-accent").trim() || "#80e6ff";
      const muted = rootStyle.getPropertyValue("--glass-muted").trim() || "#9eb9c5";
      const border = rootStyle.getPropertyValue("--glass-border-strong").trim() || "rgba(174,224,241,.42)";

      const depths = sector.points.map((point) => point[2]);
      const depthMin = depths.length ? Math.min(...depths) : 0;
      const depthMax = depths.length ? Math.max(...depths) : 1;
      const depthSpan = Math.max(depthMax - depthMin, 1e-12);
      const lonSpan = Math.max(sector.east - sector.west, 1e-12);
      const latSpan = Math.max(sector.north - sector.south, 1e-12);
      const yaw = -0.72;
      const pitch = -0.48;
      const scale = Math.min(width * 0.60, height * 0.56);

      const project = (nx: number, ny: number, nz: number) => {
        const cosYaw = Math.cos(yaw);
        const sinYaw = Math.sin(yaw);
        const x1 = nx * cosYaw - nz * sinYaw;
        const z1 = nx * sinYaw + nz * cosYaw;
        const cosPitch = Math.cos(pitch);
        const sinPitch = Math.sin(pitch);
        const y1 = ny * cosPitch - z1 * sinPitch;
        const z2 = ny * sinPitch + z1 * cosPitch;
        const perspective = 1 / Math.max(2.2, 3.1 + z2 * 0.46);
        return {
          x: width * 0.5 + x1 * scale * perspective,
          y: height * 0.46 + y1 * scale * perspective,
          cameraDepth: z2
        };
      };

      const corners = [
        [-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1],
        [-1, 1.55, -1], [1, 1.55, -1], [1, 1.55, 1], [-1, 1.55, 1]
      ] as const;
      const projectedCorners = corners.map(([x, y, z]) => project(x, y, z));
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ] as const;

      context.strokeStyle = active ? accent : border;
      context.lineWidth = active ? 1.35 : 0.9;
      for (const [a, b] of edges) {
        context.beginPath();
        context.moveTo(projectedCorners[a].x, projectedCorners[a].y);
        context.lineTo(projectedCorners[b].x, projectedCorners[b].y);
        context.stroke();
      }

      const maximumPoints = 650;
      const stride = Math.max(1, Math.ceil(sector.points.length / maximumPoints));
      const projected = [] as Array<{ x: number; y: number; cameraDepth: number; value: number }>;
      for (let index = 0; index < sector.points.length; index += stride) {
        const [longitude, latitude, depth, value] = sector.points[index];
        const nx = ((longitude - sector.west) / lonSpan - 0.5) * 2;
        const nz = ((latitude - sector.south) / latSpan - 0.5) * 2;
        const ny = ((depth - depthMin) / depthSpan) * 1.55;
        projected.push({ ...project(nx, ny, nz), value });
      }
      projected.sort((a, b) => b.cameraDepth - a.cameraDepth);
      for (const point of projected) {
        context.beginPath();
        context.arc(point.x, point.y, active ? 1.8 : 1.35, 0, Math.PI * 2);
        context.fillStyle = colourFor(point.value, minimum, maximum, palette, active ? 0.92 : 0.76);
        context.fill();
      }

      if (sector.points.length === 0) {
        context.fillStyle = muted;
        context.font = "11px system-ui, sans-serif";
        context.textAlign = "center";
        context.fillText("No verified samples", width / 2, height / 2);
      }
    };

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => observer.disconnect();
  }, [sector, minimum, maximum, palette, active]);

  return (
    <button
      type="button"
      className={`phase3-sector-card ${active ? "active" : ""}`}
      onClick={onSelect}
      data-sector-id={sector.id}
      aria-pressed={active}
      aria-label={`${sector.code}, ${sector.west.toFixed(2)} to ${sector.east.toFixed(2)} degrees east, ${sector.south.toFixed(2)} to ${sector.north.toFixed(2)} degrees north`}
    >
      <div className="phase3-sector-card-head">
        <strong>{sector.code}</strong>
        <span>{sector.points.length.toLocaleString()} samples</span>
      </div>
      <canvas ref={canvasRef} className="phase3-sector-canvas" aria-hidden="true" />
      <div className="phase3-sector-meta">
        <span>{sector.west.toFixed(2)}–{sector.east.toFixed(2)}°E</span>
        <span>{sector.south.toFixed(2)}–{sector.north.toFixed(2)}°N</span>
      </div>
      <div className="phase3-sector-meta">
        <span>{sector.depthCount} depths</span>
        <span>{sector.mean == null ? "—" : sector.mean.toFixed(2)}</span>
      </div>
    </button>
  );
}

export function Phase3ArabianAtlas() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [open, setOpen] = useState(false);
  const [variable, setVariable] = useState<AtlasVariable>("thetao");
  const [payload, setPayload] = useState<AtlasPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSectorId, setSelectedSectorId] = useState<number | null>(null);

  const onExploreRoute = hash === "" || hash === "#" || hash.startsWith("#/explore");

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    if (!onExploreRoute) setOpen(false);
  }, [onExploreRoute]);

  useEffect(() => {
    if (!open || !onExploreRoute) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setPayload(null);
    setSelectedSectorId(null);

    const request: Promise<VolumeResponse | CurrentsVolumeResponse> = variable === "currents"
      ? api.currentsVolume(0)
      : api.volume(variable, 0);

    request
      .then((result) => {
        if (cancelled) return;
        setPayload(normalisePayload(variable, result));
      })
      .catch((reason: Error) => {
        if (cancelled) return;
        setError(reason.message || "Verified 3D volume unavailable.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, onExploreRoute, variable]);

  const atlas = useMemo(() => payload ? buildSectors(payload.points) : null, [payload]);
  const selectedSector = atlas?.sectors.find((sector) => sector.id === selectedSectorId) ?? null;
  const variableMeta = VARIABLE_META[variable];

  if (!onExploreRoute) return null;

  return (
    <div className="phase3-atlas-root" data-phase="3" data-testid="phase3-arabian-atlas">
      {!open && (
        <button
          type="button"
          className="phase3-atlas-launcher"
          onClick={() => setOpen(true)}
          aria-expanded="false"
          data-testid="phase3-atlas-launcher"
        >
          <span className="phase3-live-dot" />
          <span>
            <strong>Arabian Sea 3D Atlas</strong>
            <small>12 verified sectors · Phase 3</small>
          </span>
        </button>
      )}

      {open && (
        <>
          <button
            type="button"
            className="phase3-atlas-backdrop"
            aria-label="Close Arabian Sea 3D Atlas"
            onClick={() => setOpen(false)}
          />
          <aside className="phase3-atlas-panel" role="dialog" aria-modal="true" aria-labelledby="phase3-atlas-title">
            <header className="phase3-atlas-header">
              <div>
                <span className="phase3-kicker">PHASE 3 · VERIFIED MULTI-BLOCK WATER COLUMN</span>
                <h2 id="phase3-atlas-title">Arabian Sea 3D Sector Atlas</h2>
                <p>
                  Twelve spatial sub-volumes are cut directly from the same verified GLORYS12V1 Arabian Sea field.
                  They are not twelve independent forecasts or model runs; values, coordinates and depth levels remain source-derived.
                </p>
              </div>
              <button type="button" className="phase3-atlas-close" onClick={() => setOpen(false)} aria-label="Close 3D sector atlas">×</button>
            </header>

            <div className="phase3-atlas-toolbar">
              <div className="phase3-variable-switcher" role="group" aria-label="3D atlas variable">
                {(Object.keys(VARIABLE_META) as AtlasVariable[]).map((candidate) => (
                  <button
                    type="button"
                    key={candidate}
                    className={variable === candidate ? "active" : ""}
                    onClick={() => setVariable(candidate)}
                    aria-pressed={variable === candidate}
                  >
                    {VARIABLE_META[candidate].label}
                  </button>
                ))}
              </div>
              <div className="phase3-atlas-status" aria-live="polite">
                {payload ? (
                  <>
                    <strong>{payload.label}</strong>
                    <span>{payload.time.replace("T", " ").replace("Z", " UTC")}</span>
                    <span>{payload.minimum.toFixed(3)}–{payload.maximum.toFixed(3)} {payload.units}</span>
                  </>
                ) : (
                  <span>{loading ? "Loading verified 3D evidence…" : "Waiting for verified volume"}</span>
                )}
              </div>
            </div>

            {error && (
              <div className="phase3-atlas-error" role="alert">
                <strong>Atlas data unavailable</strong>
                <span>{error}</span>
              </div>
            )}

            {loading && <div className="phase3-atlas-loading">Building twelve source-faithful 3D sectors…</div>}

            {payload && atlas && (
              <>
                <div className="phase3-atlas-summary">
                  <span>Coverage {atlas.bounds.west.toFixed(2)}–{atlas.bounds.east.toFixed(2)}°E · {atlas.bounds.south.toFixed(2)}–{atlas.bounds.north.toFixed(2)}°N</span>
                  <span>{payload.points.length.toLocaleString()} verified 3D samples · {SECTOR_COUNT} sectors</span>
                  <span>{selectedSector ? `${selectedSector.code} selected` : "All sectors visible"}</span>
                </div>

                <div className="phase3-sector-grid" data-testid="phase3-sector-grid">
                  {atlas.sectors.map((sector) => (
                    <SectorMiniBlock
                      key={sector.id}
                      sector={sector}
                      minimum={payload.minimum}
                      maximum={payload.maximum}
                      palette={variableMeta.palette}
                      active={sector.id === selectedSectorId}
                      onSelect={() => setSelectedSectorId((current) => current === sector.id ? null : sector.id)}
                    />
                  ))}
                </div>

                <footer className="phase3-atlas-footer">
                  <strong>{selectedSector ? selectedSector.code : "FULL ATLAS"}</strong>
                  <span>
                    {selectedSector
                      ? `${selectedSector.west.toFixed(3)}–${selectedSector.east.toFixed(3)}°E · ${selectedSector.south.toFixed(3)}–${selectedSector.north.toFixed(3)}°N · ${selectedSector.depthCount} genuine depths · ${selectedSector.points.length.toLocaleString()} samples`
                      : "The existing Water Column 3D remains the full-region overview; this atlas adds a spatially resolved multi-block view of the same canonical evidence."}
                  </span>
                </footer>
              </>
            )}
          </aside>
        </>
      )}
    </div>
  );
}
