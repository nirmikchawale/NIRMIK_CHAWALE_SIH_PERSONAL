import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent
} from "react";

import type { ColorPalette, ColorScaleMode, CurrentsVolumeResponse, VolumeResponse } from "../types";
import { displayUnits } from "../units";
import { nativeDepthBalancedLodIndices, waterColumnPilotLodBudget } from "../main-block-lod";
import { paletteCssGradient, paletteHsl } from "../palettes";
import { CURRENT_VERIFIED_BASELINE, blockBoundsLabel, type OceanMainBlock } from "../main-block-engine";
import {
  activeMainBlockRegion,
  isVerifiedBaseline,
  publishActiveMainBlockId,
  readActiveMainBlockId,
  resolveMainBlock,
  subscribeActiveMainBlock
} from "../main-block-runtime";
import { CameraOrientationHud, type CameraPreset } from "./CameraOrientationHud";

interface Props {
  volume: VolumeResponse | null;
  currentsVolume: CurrentsVolumeResponse | null;
  selectedDepthM: number;
  verticalExaggeration: number;
  opacity: number;
  colorPalette: ColorPalette;
  colorScale: ColorScaleMode;
  colorMinimum: number;
  colorMaximum: number;
  isoSurfaceEnabled: boolean;
  isoValue: number;
  theme: "dark" | "light";
}

interface ProjectedPoint {
  x: number;
  y: number;
  cameraDepth: number;
  longitude: number;
  latitude: number;
  depth: number;
  value: number;
  selected: boolean;
  u?: number;
  v?: number;
}

interface HoverPoint {
  longitude: number;
  latitude: number;
  depth: number;
  value: number;
  u?: number;
  v?: number;
}

const DEFAULT_ORBIT = { yaw: -0.72, pitch: -0.46, zoom: 1 };

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function colourFor(
  value: number,
  minimum: number,
  maximum: number,
  palette: ColorPalette,
  scale: ColorScaleMode,
  alpha: number
): string {
  const safeMin = Number.isFinite(minimum) ? minimum : value;
  const safeMax = Number.isFinite(maximum) && maximum > safeMin ? maximum : safeMin + 1e-12;
  const useLog = scale === "log" && safeMin > 0 && safeMax > 0 && value > 0;
  const raw = useLog
    ? (Math.log(value) - Math.log(safeMin)) / Math.max(Math.log(safeMax) - Math.log(safeMin), 1e-12)
    : (value - safeMin) / Math.max(safeMax - safeMin, 1e-12);
  const t = clamp(raw, 0, 1);
  const [hue, saturation, lightness] = paletteHsl(t, palette);
  return "hsla(" + hue.toFixed(1) + ", " + saturation + "%, " + lightness.toFixed(1) + "%, " + alpha.toFixed(3) + ")";
}

type ScientificVertex = [number, number, number];
type IsoTriangle = [ScientificVertex, ScientificVertex, ScientificVertex];

function vertexKey(vertex: ScientificVertex): string {
  return vertex.map((value) => value.toPrecision(12)).join("|");
}

function buildIsoTriangles(volume: VolumeResponse, isoValue: number, limit = 12000): IsoTriangle[] {
  const longitudes = Array.from(new Set(volume.points.map((point) => point[0]))).sort((a, b) => a - b);
  const latitudes = Array.from(new Set(volume.points.map((point) => point[1]))).sort((a, b) => a - b);
  const depths = Array.from(new Set(volume.points.map((point) => point[2]))).sort((a, b) => a - b);
  const values = new Map<string, number>();
  for (const [lon, lat, depth, value] of volume.points) {
    values.set(vertexKey([lon, lat, depth]), value);
  }

  const tetrahedra = [
    [0, 1, 2, 6],
    [0, 2, 3, 6],
    [0, 3, 7, 6],
    [0, 7, 4, 6],
    [0, 4, 5, 6],
    [0, 5, 1, 6]
  ] as const;
  const edges = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]] as const;
  const triangles: IsoTriangle[] = [];

  const interpolate = (a: ScientificVertex, b: ScientificVertex, va: number, vb: number): ScientificVertex => {
    const denominator = vb - va;
    const t = Math.abs(denominator) < 1e-12 ? 0.5 : clamp((isoValue - va) / denominator, 0, 1);
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t
    ];
  };

  for (let di = 0; di < depths.length - 1 && triangles.length < limit; di += 1) {
    for (let yi = 0; yi < latitudes.length - 1 && triangles.length < limit; yi += 1) {
      for (let xi = 0; xi < longitudes.length - 1 && triangles.length < limit; xi += 1) {
        const x0 = longitudes[xi], x1 = longitudes[xi + 1];
        const y0 = latitudes[yi], y1 = latitudes[yi + 1];
        const z0 = depths[di], z1 = depths[di + 1];
        const corners: ScientificVertex[] = [
          [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
          [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]
        ];
        const cornerValues = corners.map((vertex) => values.get(vertexKey(vertex)));
        if (cornerValues.some((value) => value == null || !Number.isFinite(value))) continue;

        for (const tetra of tetrahedra) {
          const vertices = tetra.map((index) => corners[index]);
          const tetraValues = tetra.map((index) => cornerValues[index] as number);
          const intersections: ScientificVertex[] = [];
          const seen = new Set<string>();

          for (const [ea, eb] of edges) {
            const va = tetraValues[ea];
            const vb = tetraValues[eb];
            const da = va - isoValue;
            const db = vb - isoValue;
            let point: ScientificVertex | null = null;
            if (Math.abs(da) < 1e-12) point = vertices[ea];
            else if (Math.abs(db) < 1e-12) point = vertices[eb];
            else if (da * db < 0) point = interpolate(vertices[ea], vertices[eb], va, vb);
            if (point) {
              const key = vertexKey(point);
              if (!seen.has(key)) {
                seen.add(key);
                intersections.push(point);
              }
            }
          }

          if (intersections.length === 3) {
            triangles.push([intersections[0], intersections[1], intersections[2]]);
          } else if (intersections.length === 4) {
            triangles.push([intersections[0], intersections[1], intersections[2]]);
            if (triangles.length < limit) triangles.push([intersections[0], intersections[2], intersections[3]]);
          }
          if (triangles.length >= limit) break;
        }
      }
    }
  }
  return triangles;
}

function PlannedMainBlockShell({ block, theme }: { block: OceanMainBlock; theme: "dark" | "light" }) {
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
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const dark = theme === "dark";
      const background = context.createRadialGradient(width * 0.5, height * 0.4, 10, width * 0.5, height * 0.45, Math.max(width, height) * 0.72);
      background.addColorStop(0, dark ? "#0a2a3b" : "#f6fbfd");
      background.addColorStop(1, dark ? "#01070c" : "#dceaf0");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      const yaw = -0.72;
      const pitch = -0.46;
      const scale = Math.min(width * 0.76, Math.max(180, height - 150) * 0.86);
      const project = (x: number, y: number, z: number) => {
        const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw);
        const x1 = x * cosYaw - z * sinYaw;
        const z1 = x * sinYaw + z * cosYaw;
        const cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch);
        const y1 = y * cosPitch - z1 * sinPitch;
        const z2 = y * sinPitch + z1 * cosPitch;
        const perspective = 1 / Math.max(2.25, 3.1 + z2 * 0.48);
        return { x: width * 0.52 + x1 * scale * perspective, y: height * 0.48 + y1 * scale * perspective };
      };

      const corners = [
        [-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1],
        [-1, 1.7, -1], [1, 1.7, -1], [1, 1.7, 1], [-1, 1.7, 1]
      ] as const;
      const points = corners.map(([x, y, z]) => project(x, y, z));
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ] as const;
      context.strokeStyle = dark ? "rgba(111,230,250,.78)" : "rgba(18,121,153,.72)";
      context.lineWidth = 1.5;
      for (const [a, b] of edges) {
        context.beginPath();
        context.moveTo(points[a].x, points[a].y);
        context.lineTo(points[b].x, points[b].y);
        context.stroke();
      }

      for (let layer = 1; layer < 5; layer += 1) {
        const y = (layer / 5) * 1.7;
        const layerPoints = [project(-1, y, -1), project(1, y, -1), project(1, y, 1), project(-1, y, 1)];
        context.beginPath();
        layerPoints.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
        context.closePath();
        context.strokeStyle = dark ? "rgba(100,190,218,.19)" : "rgba(45,104,126,.18)";
        context.lineWidth = 1;
        context.stroke();
      }

      context.fillStyle = dark ? "rgba(210,240,247,.72)" : "rgba(31,75,91,.74)";
      context.font = "11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      context.fillText(`${block.west.toFixed(0)}°E`, points[0].x - 18, points[0].y - 8);
      context.fillText(`${block.east.toFixed(0)}°E`, points[1].x - 2, points[1].y - 8);
      context.fillText(`${block.south.toFixed(0)}°N`, points[0].x - 18, points[0].y + 16);
      context.fillText(`${block.north.toFixed(0)}°N`, points[3].x - 18, points[3].y + 16);
      context.fillText("SOURCE DEPTH AXIS PENDING", points[7].x + 8, points[7].y);
    };

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => observer.disconnect();
  }, [block, theme]);

  return (
    <main
      className="globe-shell water-column-shell planned-main-block-shell"
      data-main-block-id={block.id}
      data-materialization="planned"
      data-scientific-values="0"
      aria-label={`Planned Water Column 3D shell for ${block.id}`}
    >
      <canvas ref={canvasRef} className="planned-main-block-canvas" aria-hidden="true" />
      <section className="main-block-water-shell-summary" data-testid="planned-main-block-shell">
        <div className="main-block-water-shell-heading">
          <div>
            <span>INTEGRATED WATER COLUMN TARGET</span>
            <strong>PLANNED TARGET · NO MATERIALIZED VOLUME</strong>
            <small>{block.id} · {activeMainBlockRegion(block)} · {blockBoundsLabel(block)}</small>
          </div>
          <span className="main-block-status-pill">0 values</span>
        </div>
        <dl className="main-block-water-shell-meta">
          <div><dt>Geographic footprint</dt><dd>{blockBoundsLabel(block)}</dd></div>
          <div><dt>Source plan</dt><dd>GLORYS12V1 historical + verified operational companion</dd></div>
          <div><dt>Variables reserved</dt><dd>Temperature · Salinity · horizontal currents</dd></div>
          <div><dt>Time hierarchy</dt><dd>Block → date → native time → variable → depth</dd></div>
          <div><dt>Depth geometry</dt><dd>Source depth axis pending genuine materialization</dd></div>
          <div><dt>Scientific values</dt><dd>0 bundled for this target; none copied from the baseline</dd></div>
        </dl>
        <div className="main-block-water-shell-actions">
          <button type="button" onClick={() => publishActiveMainBlockId(CURRENT_VERIFIED_BASELINE.id)}>
            Return to verified baseline volume
          </button>
        </div>
      </section>
      <div className="main-block-water-shell-disclosure" role="status">
        <strong>SCIENTIFIC BOUNDARY</strong>
        <span>This is the real geographic shell for {block.id}, integrated into the same Water Column 3D workflow.</span>
        <small>No temperature, salinity, current or depth values are fabricated. Phase 3.5B can replace this empty shell only after a genuine source-backed volume is acquired and verified.</small>
      </div>
    </main>
  );
}

export function WaterColumn3D({
  volume,
  currentsVolume,
  selectedDepthM,
  verticalExaggeration,
  opacity,
  colorPalette,
  colorScale,
  colorMinimum,
  colorMaximum,
  isoSurfaceEnabled,
  isoValue,
  theme
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef<number | null>(null);
  const touchPinchActiveRef = useRef(false);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const zoomAnimationRef = useRef<number | null>(null);
  const projectedRef = useRef<ProjectedPoint[]>([]);
  const [orbit, setOrbit] = useState(DEFAULT_ORBIT);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("perspective");
  const [hover, setHover] = useState<HoverPoint | null>(null);
  const [activeMainBlockId, setActiveMainBlockId] = useState(readActiveMainBlockId);
  const activeMainBlock = resolveMainBlock(activeMainBlockId);

  useEffect(() => subscribeActiveMainBlock(setActiveMainBlockId), []);

  const depthLevels = useMemo(() => {
    if (volume) return Array.from(new Set(volume.points.map((point) => point[2]))).sort((a, b) => a - b);
    return currentsVolume?.depths_m.slice().sort((a, b) => a - b) ?? [];
  }, [volume, currentsVolume]);

  const spatialPoints = useMemo<Array<[number, number, number, number]>>(
    () => volume
      ? volume.points
      : currentsVolume
        ? currentsVolume.vectors.map(([longitude, latitude, depth, , , speed]) => [longitude, latitude, depth, speed])
        : [],
    [volume, currentsVolume]
  );

  const dataLabel = volume?.label ?? (currentsVolume ? "Current speed" : "Ocean field");
  const dataUnits = displayUnits(volume?.units ?? currentsVolume?.units);
  const dataTime = volume?.time ?? currentsVolume?.time ?? "";

  const isoTriangles = useMemo(
    () => (volume && isoSurfaceEnabled ? buildIsoTriangles(volume, isoValue) : []),
    [volume, isoSurfaceEnabled, isoValue]
  );

  const selectedDepth = useMemo(() => {
    if (depthLevels.length === 0) return selectedDepthM;
    return depthLevels.reduce((nearest, depth) =>
      Math.abs(depth - selectedDepthM) < Math.abs(nearest - selectedDepthM) ? depth : nearest
    );
  }, [depthLevels, selectedDepthM]);

  // LOD alters only canvas points; complete source volumes, depth axis,
  // isosurface inputs and scientific analyses remain untouched.
  const visibleScalarIndices = useMemo(() =>
    volume && activeMainBlock.materialization === "pilot"
      ? nativeDepthBalancedLodIndices(volume.points, waterColumnPilotLodBudget(orbit.zoom), selectedDepth)
      : null,
    [volume, activeMainBlockId, orbit.zoom, selectedDepth]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || spatialPoints.length === 0) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let disposed = false;

    const draw = () => {
      if (disposed) return;

      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const dark = theme === "dark";
      const background = context.createRadialGradient(
        width * 0.52,
        height * 0.42,
        12,
        width * 0.52,
        height * 0.42,
        Math.max(width, height) * 0.72
      );
      background.addColorStop(0, dark ? "#0b2634" : "#f9fcfd");
      background.addColorStop(1, dark ? "#01070c" : "#dfeaf0");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      const longitudes = spatialPoints.map((point) => point[0]);
      const latitudes = spatialPoints.map((point) => point[1]);
      const depths = spatialPoints.map((point) => point[2]);
      const lonMin = Math.min(...longitudes);
      const lonMax = Math.max(...longitudes);
      const latMin = Math.min(...latitudes);
      const latMax = Math.max(...latitudes);
      const depthMin = Math.min(...depths);
      const depthMax = Math.max(...depths);
      const lonSpan = Math.max(lonMax - lonMin, 1e-9);
      const latSpan = Math.max(latMax - latMin, 1e-9);
      const depthSpan = Math.max(depthMax - depthMin, 1e-9);
      const depthAspect = 0.42 + 0.024 * clamp(verticalExaggeration, 1, 100);
      // Fit the initial scientific box inside the dedicated canvas, leaving
      // room for readable inspection and camera controls on compact screens.
      const baseScale = Math.min(width * 0.95, Math.max(140, height - 145) * 1.35);

      const projectNormalised = (nx: number, ny: number, nz: number) => {
        const cosYaw = Math.cos(orbit.yaw);
        const sinYaw = Math.sin(orbit.yaw);
        const x1 = nx * cosYaw - nz * sinYaw;
        const z1 = nx * sinYaw + nz * cosYaw;

        const cosPitch = Math.cos(orbit.pitch);
        const sinPitch = Math.sin(orbit.pitch);
        const y1 = ny * cosPitch - z1 * sinPitch;
        const z2 = ny * sinPitch + z1 * cosPitch;

        const perspective = orbit.zoom / Math.max(2.25, 3.2 + z2 * 0.5);
        return {
          x: width * 0.5 + x1 * baseScale * perspective,
          y: height * 0.43 + y1 * baseScale * perspective,
          cameraDepth: z2
        };
      };

      const projectScientific = (longitude: number, latitude: number, depth: number) => {
        const nx = ((longitude - lonMin) / lonSpan - 0.5) * 2;
        const nz = ((latitude - latMin) / latSpan - 0.5) * 2;
        const ny = ((depth - depthMin) / depthSpan) * depthAspect;
        return projectNormalised(nx, ny, nz);
      };

      const gridStroke = dark ? "rgba(125, 178, 199, 0.23)" : "rgba(48, 92, 111, 0.24)";
      const strongStroke = dark ? "rgba(95, 218, 241, 0.52)" : "rgba(20, 124, 155, 0.58)";
      const selectedFill = dark ? "rgba(87, 219, 242, 0.10)" : "rgba(27, 140, 172, 0.10)";
      const selectedStroke = dark ? "rgba(111, 232, 249, 0.78)" : "rgba(15, 116, 145, 0.78)";

      const boxAt = (depthFraction: number) => {
        const y = depthFraction * depthAspect;
        return [
          projectNormalised(-1, y, -1),
          projectNormalised(1, y, -1),
          projectNormalised(1, y, 1),
          projectNormalised(-1, y, 1)
        ];
      };

      const drawPolygon = (
        points: Array<{ x: number; y: number }>,
        stroke: string,
        fill?: string,
        widthPx = 1
      ) => {
        context.beginPath();
        points.forEach((point, index) => {
          if (index === 0) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        });
        context.closePath();
        if (fill) {
          context.fillStyle = fill;
          context.fill();
        }
        context.strokeStyle = stroke;
        context.lineWidth = widthPx;
        context.stroke();
      };

      const topBox = boxAt(0);
      const bottomBox = boxAt(1);
      drawPolygon(topBox, strongStroke, undefined, 1.1);
      drawPolygon(bottomBox, gridStroke, undefined, 1);
      for (let index = 0; index < 4; index += 1) {
        context.beginPath();
        context.moveTo(topBox[index].x, topBox[index].y);
        context.lineTo(bottomBox[index].x, bottomBox[index].y);
        context.strokeStyle = gridStroke;
        context.lineWidth = 1;
        context.stroke();
      }

      for (let tick = 1; tick < 5; tick += 1) {
        const layer = boxAt(tick / 5);
        drawPolygon(layer, gridStroke);
      }

      const selectedFraction = clamp((selectedDepth - depthMin) / depthSpan, 0, 1);
      drawPolygon(boxAt(selectedFraction), selectedStroke, selectedFill, 1.5);

      if (isoSurfaceEnabled && isoTriangles.length > 0) {
        const isoFill = colourFor(isoValue, colorMinimum, colorMaximum, colorPalette, colorScale, 0.15);
        const isoStroke = colourFor(isoValue, colorMinimum, colorMaximum, colorPalette, colorScale, 0.72);
        for (const triangle of isoTriangles) {
          const screen = triangle.map(([longitude, latitude, depth]) => projectScientific(longitude, latitude, depth));
          drawPolygon(screen, isoStroke, isoFill, 0.7);
        }
      }

      const projected: ProjectedPoint[] = [];
      if (volume) {
        const canvasPoints = visibleScalarIndices
          ? visibleScalarIndices.map((index) => volume.points[index])
          : volume.points;
        for (const [longitude, latitude, depth, value] of canvasPoints) {
          const screen = projectScientific(longitude, latitude, depth);
          projected.push({
            ...screen,
            longitude,
            latitude,
            depth,
            value,
            selected: Math.abs(depth - selectedDepth) < 1e-8
          });
        }

        projected.sort((a, b) => b.cameraDepth - a.cameraDepth);
        for (const point of projected) {
          const pointAlpha = point.selected ? Math.min(1, opacity + 0.28) : opacity;
          context.beginPath();
          context.arc(point.x, point.y, point.selected ? 3.2 : 1.65, 0, Math.PI * 2);
          context.fillStyle = colourFor(point.value, colorMinimum, colorMaximum, colorPalette, colorScale, pointAlpha);
          context.fill();
          if (point.selected) {
            context.strokeStyle = dark ? "rgba(244, 253, 255, 0.55)" : "rgba(18, 65, 82, 0.42)";
            context.lineWidth = 0.6;
            context.stroke();
          }
        }
      } else if (currentsVolume) {
        const maxVectors = 2600;
        const vectorStride = Math.max(1, Math.ceil(currentsVolume.vectors.length / maxVectors));
        const displayScaleDegrees = 0.55;
        for (let index = 0; index < currentsVolume.vectors.length; index += vectorStride) {
          const [longitude, latitude, depth, u, v, speed] = currentsVolume.vectors[index];
          const start = projectScientific(longitude, latitude, depth);
          const cosLat = Math.max(Math.cos((latitude * Math.PI) / 180), 0.25);
          const end = projectScientific(
            longitude + (u * displayScaleDegrees) / cosLat,
            latitude + v * displayScaleDegrees,
            depth
          );
          const selected = Math.abs(depth - selectedDepth) < 1e-8;
          const alpha = selected ? Math.min(1, opacity + 0.22) : Math.max(0.16, opacity * 0.48);
          const stroke = colourFor(speed, colorMinimum, colorMaximum, colorPalette, colorScale, alpha);
          context.beginPath();
          context.moveTo(start.x, start.y);
          context.lineTo(end.x, end.y);
          context.strokeStyle = stroke;
          context.lineWidth = selected ? 2.2 : 1.05;
          context.stroke();

          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const length = Math.max(Math.hypot(dx, dy), 1e-9);
          const ux = dx / length;
          const uy = dy / length;
          const headLength = selected ? 5.5 : 3.8;
          context.beginPath();
          context.moveTo(end.x, end.y);
          context.lineTo(end.x - ux * headLength - uy * headLength * 0.55, end.y - uy * headLength + ux * headLength * 0.55);
          context.moveTo(end.x, end.y);
          context.lineTo(end.x - ux * headLength + uy * headLength * 0.55, end.y - uy * headLength - ux * headLength * 0.55);
          context.strokeStyle = stroke;
          context.lineWidth = selected ? 1.8 : 1;
          context.stroke();

          projected.push({
            ...start,
            longitude,
            latitude,
            depth,
            value: speed,
            selected,
            u,
            v
          });
        }
      }
      projected.sort((a, b) => b.cameraDepth - a.cameraDepth);
      projectedRef.current = projected;

      const axisText = dark ? "rgba(201, 232, 241, 0.72)" : "rgba(33, 74, 91, 0.76)";
      context.fillStyle = axisText;
      context.font = "10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      context.fillText(lonMin.toFixed(2) + "°E", topBox[0].x - 8, topBox[0].y - 8);
      context.fillText(lonMax.toFixed(2) + "°E", topBox[1].x - 4, topBox[1].y - 8);
      context.fillText(latMin.toFixed(2) + "°N", topBox[0].x - 8, topBox[0].y + 14);
      context.fillText(latMax.toFixed(2) + "°N", topBox[3].x - 8, topBox[3].y + 14);
      context.fillText(depthMin.toFixed(2) + " m", topBox[3].x + 8, topBox[3].y);
      context.fillText(depthMax.toFixed(2) + " m", bottomBox[3].x + 8, bottomBox[3].y);
    };

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();

    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [volume, currentsVolume, spatialPoints, selectedDepth, verticalExaggeration, opacity, orbit, theme, colorPalette, colorScale, colorMinimum, colorMaximum, isoSurfaceEnabled, isoValue, isoTriangles, visibleScalarIndices]);

  useEffect(() => () => {
    if (zoomAnimationRef.current != null) window.cancelAnimationFrame(zoomAnimationRef.current);
  }, []);

  // Native non-passive touch handling complements the pointer path. Chromium
// automation and some mobile WebViews can dispatch a real TouchEvent stream
// without two usable PointerEvents, so the scientific camera must accept both.
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  let nativePinchDistance: number | null = null;
  const distanceOf = (touches: TouchList) => {
    if (touches.length < 2) return null;
    const a = touches[0];
    const b = touches[1];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const handleTouchStart = (event: TouchEvent) => {
    const distance = distanceOf(event.touches);
    if (distance == null) return;
    event.preventDefault();
    touchPinchActiveRef.current = true;
    if (zoomAnimationRef.current != null) window.cancelAnimationFrame(zoomAnimationRef.current);
    zoomAnimationRef.current = null;
    nativePinchDistance = distance;
    pinchDistanceRef.current = distance;
    setHover(null);
  };

  const handleTouchMove = (event: TouchEvent) => {
    const distance = distanceOf(event.touches);
    if (distance == null) return;
    event.preventDefault();
    touchPinchActiveRef.current = true;
    const previous = nativePinchDistance ?? pinchDistanceRef.current;
    if (previous && distance > 0) {
      setOrbit((current) => ({
        ...current,
        zoom: clamp(current.zoom * distance / previous, 0.62, 1.9)
      }));
    }
    nativePinchDistance = distance;
    pinchDistanceRef.current = distance;
  };

  const handleTouchEnd = (event: TouchEvent) => {
    const distance = distanceOf(event.touches);
    if (distance == null) {
      touchPinchActiveRef.current = false;
      nativePinchDistance = null;
      pinchDistanceRef.current = null;
      return;
    }
    nativePinchDistance = distance;
    pinchDistanceRef.current = distance;
  };

  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
  canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

  return () => {
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);
    canvas.removeEventListener('touchcancel', handleTouchEnd);
  };
}, [activeMainBlockId, volume, currentsVolume]);

  const smoothWaterZoomTo = (targetZoom: number) => {
    if (zoomAnimationRef.current != null) {
      window.cancelAnimationFrame(zoomAnimationRef.current);
      zoomAnimationRef.current = null;
    }

    const startZoom = orbit.zoom;
    const target = clamp(targetZoom, 0.62, 1.9);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOrbit((current) => ({ ...current, zoom: target }));
      return;
    }
    const startedAt = performance.now();
    const durationMs = 420;

    const animate = (now: number) => {
      const raw = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - raw, 3);
      const zoom = startZoom + (target - startZoom) * eased;
      setOrbit((current) => ({ ...current, zoom }));

      if (raw < 1) {
        zoomAnimationRef.current = window.requestAnimationFrame(animate);
      } else {
        zoomAnimationRef.current = null;
      }
    };

    zoomAnimationRef.current = window.requestAnimationFrame(animate);
  };

  const smoothWaterZoom = (direction: "in" | "out") => {
    const factor = direction === "in" ? 1.28 : 0.78;
    smoothWaterZoomTo(orbit.zoom * factor);
  };

  const applyCameraPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);

    if (preset === "north") {
      setOrbit((current) => ({ ...current, yaw: 0 }));
      return;
    }

    if (preset === "nadir") {
      smoothWaterZoomTo(0.92);
      setOrbit((current) => ({ ...current, yaw: 0, pitch: -1.1 }));
      return;
    }

    if (preset === "perspective") {
      smoothWaterZoomTo(DEFAULT_ORBIT.zoom);
      setOrbit((current) => ({ ...current, yaw: DEFAULT_ORBIT.yaw, pitch: DEFAULT_ORBIT.pitch }));
      return;
    }

    if (preset === "cross-section") {
      smoothWaterZoomTo(1.05);
      setOrbit((current) => ({ ...current, yaw: 0, pitch: -0.06 }));
      return;
    }

    smoothWaterZoomTo(DEFAULT_ORBIT.zoom);
    setOrbit({ ...DEFAULT_ORBIT });
  };

  const inspectNearest = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let nearest: ProjectedPoint | null = null;
    let nearestDistance = 13;

    for (const point of projectedRef.current) {
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < nearestDistance) {
        nearest = point;
        nearestDistance = distance;
      }
    }

    setHover(
      nearest
        ? {
            longitude: nearest.longitude,
            latitude: nearest.latitude,
            depth: nearest.depth,
            value: nearest.value,
            u: nearest.u,
            v: nearest.v
          }
        : null
    );
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (zoomAnimationRef.current != null) window.cancelAnimationFrame(zoomAnimationRef.current);
    zoomAnimationRef.current = null;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchDistanceRef.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setHover(null);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    // When a browser emits both TouchEvents and PointerEvents for the same
    // two-finger gesture, the native touch path owns pinch scaling. Pointer
    // handling remains the fallback for environments that emit pointers only.
    if (event.pointerType === "touch" && touchPinchActiveRef.current) return;
    if (!dragRef.current.active) {
      inspectNearest(event.clientX, event.clientY);
      return;
    }

    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size >= 2) {
      const [a, b] = [...pointersRef.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const previous = pinchDistanceRef.current;
      if (previous && distance > 0) {
        setOrbit(current => ({ ...current, zoom: clamp(current.zoom * distance / previous, 0.62, 1.9) }));
      }
      pinchDistanceRef.current = distance;
      return;
    }
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current.x = event.clientX;
    dragRef.current.y = event.clientY;
    setOrbit((current) => ({
      ...current,
      yaw: current.yaw + dx * 0.008,
      pitch: clamp(current.pitch + dy * 0.006, -1.15, 0.45)
    }));
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(event.pointerId);
    pinchDistanceRef.current = null;
    const remaining = pointersRef.current.values().next().value;
    dragRef.current = remaining ? { active: true, ...remaining } : { active: false, x: 0, y: 0 };
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!remaining && event.type !== "pointercancel") inspectNearest(event.clientX, event.clientY);
  };

  // Some mobile WebViews and Chromium automation surfaces deliver TouchEvents
  // without synthesizing the two PointerEvents required by the primary pinch
  // path. Keep Pointer Events canonical, but provide a touch-only fallback when
  // fewer than two pointers reached that path. touch-action:none on the canvas
  // prevents browser page zoom/scroll from stealing the scientific camera gesture.
  const onTouchStart = (event: ReactTouchEvent<HTMLCanvasElement>) => {
    if (event.touches.length < 2) return;
    event.preventDefault();
    touchPinchActiveRef.current = true;
    if (zoomAnimationRef.current != null) window.cancelAnimationFrame(zoomAnimationRef.current);
    zoomAnimationRef.current = null;
    const a = event.touches[0];
    const b = event.touches[1];
    pinchDistanceRef.current = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    setHover(null);
  };

  const onTouchMove = (event: ReactTouchEvent<HTMLCanvasElement>) => {
    if (event.touches.length < 2) return;
    event.preventDefault();
    touchPinchActiveRef.current = true;
    const a = event.touches[0];
    const b = event.touches[1];
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const previous = pinchDistanceRef.current;
    if (previous && distance > 0) {
      setOrbit((current) => ({ ...current, zoom: clamp(current.zoom * distance / previous, 0.62, 1.9) }));
    }
    pinchDistanceRef.current = distance;
  };

  const onTouchEnd = (event: ReactTouchEvent<HTMLCanvasElement>) => {
    if (event.touches.length < 2) {
      touchPinchActiveRef.current = false;
      pinchDistanceRef.current = null;
    }
  };

  const onWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (zoomAnimationRef.current != null) window.cancelAnimationFrame(zoomAnimationRef.current);
    zoomAnimationRef.current = null;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 300 : 1);
    const factor = Math.exp(-clamp(delta, -100, 100) * 0.002);
    setOrbit(current => ({ ...current, zoom: clamp(current.zoom * factor, 0.62, 1.9) }));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      setOrbit((current) => ({
        ...current,
        yaw: current.yaw + (event.key === "ArrowLeft" ? -0.12 : 0.12)
      }));
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      setOrbit((current) => ({
        ...current,
        pitch: clamp(current.pitch + (event.key === "ArrowUp" ? -0.08 : 0.08), -1.15, 0.45)
      }));
    } else if (event.key === "+" || event.key === "=" || event.key === "-") {
      event.preventDefault();
      smoothWaterZoom(event.key === "-" ? "out" : "in");
    } else if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      applyCameraPreset("perspective");
    }
  };

  if (!isVerifiedBaseline(activeMainBlock)) {
    return <PlannedMainBlockShell block={activeMainBlock} theme={theme} />;
  }

  if (!volume && !currentsVolume) {
    return (
      <main className="globe-shell water-column-shell water-column-loading">
        <div className="water-column-loading-card">
          <strong>Loading verified water-column evidence…</strong>
          <span>No synthetic values are substituted while the canonical volume is unavailable.</span>
        </div>
      </main>
    );
  }

  return (
    <main
      className="globe-shell water-column-shell"
      data-depth-count={depthLevels.length}
      data-lod-mode={visibleScalarIndices ? "native-depth-balanced" : "full-source"}
      data-lod-rendered-samples={visibleScalarIndices?.length ?? volume?.points.length ?? 0}
      data-lod-source-samples={volume?.points.length ?? 0}
      data-opacity={opacity.toFixed(2)}
      data-yaw={orbit.yaw.toFixed(3)}
      data-zoom={orbit.zoom.toFixed(3)}
      data-camera-preset={cameraPreset}
      data-color-palette={colorPalette}
      data-color-scale={colorScale}
      data-iso-enabled={isoSurfaceEnabled ? "true" : "false"}
      data-iso-triangles={isoTriangles.length}
      data-current-vector-count={currentsVolume?.vectors.length ?? 0}
      data-current-depth-count={currentsVolume?.depths_m.length ?? 0}
      data-main-block-id={activeMainBlock.id}
      data-materialization={activeMainBlock.materialization}
    >
      <div className="water-column-main-block-context" aria-label="Active verified main block">
        <span>ACTIVE MAIN BLOCK</span>
        <strong>{activeMainBlock.id} · {activeMainBlock.materialization === "pilot" ? "SOURCE-BACKED PILOT VOLUME" : "VERIFIED REFERENCE VOLUME"}</strong>
        <small>{blockBoundsLabel(activeMainBlock)} · {depthLevels.length} native depth levels · {activeMainBlock.materialization === "pilot" ? "GLORYS pilot; independent observation validation not asserted" : "independently validated GLORYS baseline"}</small>
      </div>
      <canvas
        ref={canvasRef}
        className="water-column-canvas"
        tabIndex={0}
        role="application"
        aria-label="Interactive scientific water-column 3D"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onPointerLeave={() => {
          if (!dragRef.current.active) setHover(null);
        }}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
      />

      <div className="renderer-tools" aria-label="Water-column view tools">
      <div className="globe-overlay top-left water-column-summary">
        <div>
          <span className="live-dot" />
          <strong>SCIENTIFIC WATER-COLUMN 3D</strong>
        </div>
        <span>{dataLabel} · {dataUnits}</span>
        <small>{depthLevels.length} genuine depth levels · {dataTime.replace("T", " ").replace("Z", " UTC")}</small>
        {volume && isoSurfaceEnabled && (
          <small>Isosurface {isoValue.toFixed(3)} {dataUnits} · {isoTriangles.length.toLocaleString()} extracted triangles</small>
        )}
      </div>

      <div className="globe-overlay water-column-selected">
        <span>SELECTED LAYER</span>
        <strong>{selectedDepth.toFixed(2)} m</strong>
        <small>Depth (m, positive down)</small>
      </div>

      <div className="globe-overlay water-column-legend">
        <span>{dataLabel}</span>
        <div className="gradient-bar" data-palette={colorPalette} style={{ background: paletteCssGradient(colorPalette) }} />
        <div className="legend-values">
          <span>{colorMinimum.toFixed(3)}</span>
          <span>{dataUnits}</span>
          <span>{colorMaximum.toFixed(3)}</span>
        </div>
      </div>

      <CameraOrientationHud
        context="water-column"
        activePreset={cameraPreset}
        onPreset={applyCameraPreset}
      />

      <div className="globe-overlay smooth-zoom-controls water-column-smooth-zoom" aria-label="Water-Column 3D smooth zoom">
        <span>WATER-COLUMN ZOOM</span>
        <div>
          <button type="button" aria-label="Zoom out Water-Column 3D" onClick={() => smoothWaterZoom("out")}>−</button>
          <button
            type="button"
            aria-label="Reset Water-Column 3D view"
            onClick={() => applyCameraPreset("perspective")}
          >◎</button>
          <button type="button" aria-label="Zoom in Water-Column 3D" onClick={() => smoothWaterZoom("in")}>+</button>
        </div>
        <small>420 ms eased scientific-box zoom</small>
      </div>

      <div className="globe-overlay water-column-axis-key">
        <span>AXES</span>
        <strong>Longitude °E · Latitude °N · Depth m ↓</strong>
        <small>Depth remains positive down; exaggeration changes display geometry only.</small>
      </div>

      {hover && (
        <div className="globe-overlay water-column-hover">
          <strong>Scientific inspection</strong>
          <span>Lon {hover.longitude.toFixed(3)}°E · Lat {hover.latitude.toFixed(3)}°N</span>
          <span>Depth {hover.depth.toFixed(2)} m</span>
          <span>{dataLabel}: {hover.value.toFixed(4)} {dataUnits}</span>
          {currentsVolume && hover.u != null && hover.v != null && (
            <span>u {hover.u.toFixed(4)} · v {hover.v.toFixed(4)} {dataUnits}</span>
          )}
        </div>
      )}

      <div className="globe-overlay interaction-hint water-column-hint">
        Drag to orbit · smooth wheel/buttons to zoom · arrows / +/- · R reset
      </div>

      <div className="globe-overlay volume-note water-column-note">
        {currentsVolume ? "HORIZONTAL u/v AT GENUINE DEPTHS · NO VERTICAL w INFERRED" : "CANONICAL MODEL VALUES"} · visual depth ×{verticalExaggeration} · opacity {Math.round(opacity * 100)}% · geometry only
      </div>
      </div>
    </main>
  );
}
