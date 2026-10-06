import { useMemo, useState } from "react";

import type { Catalog, ProfileDetail, VariableCard } from "../types";

interface Props {
  catalog: Catalog;
  variable: VariableCard | undefined;
  depthM: number;
  time: string;
  detail: ProfileDetail | null;
  onDepthSync: (observationDepthM: number) => void;
}

const CHART_WIDTH = 360;
const CHART_HEIGHT = 250;
const CHART_PAD = 18;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function chartPoint(
  value: number,
  depthM: number,
  xMin: number,
  xMax: number,
  maxDepth: number
) {
  return {
    x: CHART_PAD + ((value - xMin) / Math.max(xMax - xMin, 1e-9)) * (CHART_WIDTH - CHART_PAD * 2),
    y: CHART_PAD + (depthM / Math.max(maxDepth, 1e-9)) * (CHART_HEIGHT - CHART_PAD * 2)
  };
}

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(points.length - 1, index + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

function nearestIndex(values: number[], target: number) {
  if (values.length === 0) return 0;
  let bestIndex = 0;
  let bestDistance = Math.abs(values[0] - target);
  for (let index = 1; index < values.length; index += 1) {
    const distance = Math.abs(values[index] - target);
    if (distance < bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }
  }
  return bestIndex;
}

export function AnalysisSplitPanel({ catalog, variable, depthM, time, detail, onDepthSync }: Props) {
  const [hoveredLevelIndex, setHoveredLevelIndex] = useState<number | null>(null);

  const temperatures = detail
    ? detail.levels.flatMap((level) => [level.observed_temperature, level.model_temperature_interpolated])
    : [];
  const xMin = temperatures.length ? Math.min(...temperatures) : 0;
  const xMax = temperatures.length ? Math.max(...temperatures) : 1;
  const maxDepth = detail
    ? Math.max(...detail.levels.map((level) => level.observation_depth_m), 0)
    : 0;

  const modelPoints = detail
    ? detail.levels.map((level) =>
        chartPoint(level.model_temperature_interpolated, level.observation_depth_m, xMin, xMax, maxDepth)
      )
    : [];
  const observationPoints = detail
    ? detail.levels.map((level) =>
        chartPoint(level.observed_temperature, level.observation_depth_m, xMin, xMax, maxDepth)
      )
    : [];
  const modelPath = smoothPath(modelPoints);

  const selectedLevelIndex = useMemo(
    () => detail
      ? nearestIndex(detail.levels.map((level) => level.observation_depth_m), depthM)
      : 0,
    [detail, depthM]
  );
  const activeLevelIndex = hoveredLevelIndex ?? selectedLevelIndex;
  const activeLevel = detail?.levels[activeLevelIndex] ?? null;
  const activeModelDepth = activeLevel && catalog.coordinates.depth.length > 0
    ? catalog.coordinates.depth[nearestIndex(catalog.coordinates.depth, activeLevel.observation_depth_m)]
    : depthM;
  const activeY = activeLevel
    ? chartPoint(activeLevel.observed_temperature, activeLevel.observation_depth_m, xMin, xMax, maxDepth).y
    : CHART_PAD;

  const syncFromClientY = (target: SVGSVGElement, clientY: number) => {
    if (!detail || detail.levels.length === 0) return;
    const bounds = target.getBoundingClientRect();
    if (bounds.height <= 0) return;
    const localY = ((clientY - bounds.top) / bounds.height) * CHART_HEIGHT;
    const fraction = clamp((localY - CHART_PAD) / (CHART_HEIGHT - CHART_PAD * 2), 0, 1);
    const targetDepth = fraction * maxDepth;
    const nextIndex = nearestIndex(
      detail.levels.map((level) => level.observation_depth_m),
      targetDepth
    );
    if (nextIndex !== hoveredLevelIndex) {
      setHoveredLevelIndex(nextIndex);
      onDepthSync(detail.levels[nextIndex].observation_depth_m);
    }
  };

  return (
    <aside
      className="analysis-split-panel"
      aria-label="Analysis Split workspace"
      data-synced-model-depth={depthM.toFixed(3)}
    >
      <div className="analysis-split-heading">
        <span className="eyebrow">Workspace mode</span>
        <h2>Analysis Split</h2>
        <p>3D context and analytical evidence share the workspace without changing source values.</p>
      </div>

      <div className="analysis-context-grid">
        <div>
          <span>Active field</span>
          <strong>{variable?.label ?? "Ocean field"}</strong>
          <small>{variable?.units ?? ""}</small>
        </div>
        <div>
          <span>Selected depth</span>
          <strong>{catalog.capabilities.surface_only ? "Surface" : `${depthM.toFixed(2)} m`}</strong>
          <small>{catalog.capabilities.surface_only ? "No model depth axis" : "Depth positive down"}</small>
        </div>
        <div>
          <span>Verified time</span>
          <strong>{time.replace("T00:00:00Z", "")}</strong>
          <small>Source timestamp</small>
        </div>
        <div>
          <span>Source</span>
          <strong>{catalog.dataset.product}</strong>
          <small>{catalog.dataset.source}</small>
        </div>
      </div>

      {detail ? (
        <section className="analysis-profile-card">
          <div className="analysis-profile-title">
            <div>
              <span className="eyebrow">Model ↔ observation</span>
              <h3>Argo {detail.summary.platform_id}</h3>
            </div>
            <span className="snapshot-badge">Diagnostic comparison</span>
          </div>

          <div className="analysis-metrics">
            <div><span>MAE</span><strong>{detail.summary.mae_celsius.toFixed(3)} °C</strong></div>
            <div><span>RMSE</span><strong>{detail.summary.rmse_celsius.toFixed(3)} °C</strong></div>
            <div><span>Matched</span><strong>{detail.summary.matched_level_count}</strong></div>
          </div>

          <div
            className="analysis-profile-chart synchronized"
            data-selected-observation-depth={activeLevel?.observation_depth_m.toFixed(3) ?? ""}
          >
            <div className="analysis-chart-header">
              <span>Interactive T–Z profile · hover depth to synchronize 3D</span>
              <span>{xMin.toFixed(1)}–{xMax.toFixed(1)} °C · 0–{maxDepth.toFixed(0)} m</span>
            </div>
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              role="application"
              aria-label="Interactive synchronized model and Argo temperature profile"
              onPointerMove={(event) => syncFromClientY(event.currentTarget, event.clientY)}
              onPointerDown={(event) => syncFromClientY(event.currentTarget, event.clientY)}
              onMouseMove={(event) => syncFromClientY(event.currentTarget, event.clientY)}
              onMouseDown={(event) => syncFromClientY(event.currentTarget, event.clientY)}
              onPointerLeave={() => setHoveredLevelIndex(null)}
              onMouseLeave={() => setHoveredLevelIndex(null)}
            >
              <rect
                x="0"
                y="0"
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                fill="transparent"
                pointerEvents="all"
                className="analysis-interaction-hit-area"
              />
              <line x1="18" x2="342" y1="18" y2="18" className="analysis-grid-line" />
              <line x1="18" x2="342" y1="125" y2="125" className="analysis-grid-line" />
              <line x1="18" x2="342" y1="232" y2="232" className="analysis-grid-line" />
              <path d={modelPath} className="analysis-model-line" />
              {observationPoints.map((point, index) => {
                const radius = index === activeLevelIndex ? 5.2 : 3.8;
                return (
                  <polygon
                    key={detail.levels[index].observation_depth_m}
                    className={`analysis-observation-diamond ${index === activeLevelIndex ? "active" : ""}`}
                    points={`${point.x},${point.y - radius} ${point.x + radius},${point.y} ${point.x},${point.y + radius} ${point.x - radius},${point.y}`}
                  />
                );
              })}
              {activeLevel && (
                <>
                  <line
                    x1={CHART_PAD}
                    x2={CHART_WIDTH - CHART_PAD}
                    y1={activeY}
                    y2={activeY}
                    className="analysis-sync-depth-line"
                  />
                  <circle
                    cx={modelPoints[activeLevelIndex]?.x ?? CHART_PAD}
                    cy={activeY}
                    r="4.5"
                    className="analysis-model-active-point"
                  />
                </>
              )}
            </svg>
            <div className="analysis-chart-legend">
              <span><i className="model" /> Copernicus interpolated model · smooth cyan</span>
              <span><i className="observation diamond" /> Argo observed · amber diamonds</span>
            </div>
          </div>

          {activeLevel && (
            <div className="analysis-sync-readout" aria-live="polite">
              <div>
                <span>SYNCED DEPTH</span>
                <strong>{activeLevel.observation_depth_m.toFixed(2)} m Argo → {activeModelDepth.toFixed(2)} m model plane</strong>
              </div>
              <div className="analysis-sync-values">
                <span>Argo <strong>{activeLevel.observed_temperature.toFixed(3)} °C</strong></span>
                <span>Model <strong>{activeLevel.model_temperature_interpolated.toFixed(3)} °C</strong></span>
                <span>Bias <strong>{activeLevel.signed_bias_celsius >= 0 ? "+" : ""}{activeLevel.signed_bias_celsius.toFixed(3)} °C</strong></span>
              </div>
              <small>
                The 3D slice snaps to the nearest genuine model depth coordinate; no synthetic vertical level is created.
              </small>
            </div>
          )}

          <p className="analysis-limit-note">Diagnostic model–observation consistency, not independent validation.</p>
        </section>
      ) : (
        <section className="analysis-profile-card empty">
          <span className="eyebrow">Model ↔ observation</span>
          <h3>Comparison unavailable for this source</h3>
          <p>Only verified source-specific analytical context is shown. No observation curve is inferred.</p>
        </section>
      )}
    </aside>
  );
}
