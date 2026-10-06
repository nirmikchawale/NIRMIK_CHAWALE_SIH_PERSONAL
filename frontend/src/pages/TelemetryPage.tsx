import { useEffect, useMemo, useState } from "react";

import { api } from "../api";
import { IncoisOperationalPanel } from "../components/IncoisOperationalPanel";
import { TelemetryDirectoryNav } from "../components/TelemetryDirectoryNav";
import type {
  Catalog,
  ImportedObservationProfile,
  ProfileSummary,
  ProvenanceResponse,
  TelemetryDepthStat,
  TelemetryResponse,
  TelemetryTimeStat
} from "../types";
import { displayUnits } from "../units";
import { resolveTimeIndex } from "../time-engine";
import { publishScientificWorkspaceContext, readScientificWorkspaceContext } from "../scientific-context-runtime";

interface Props {
  catalog: Catalog;
  provenance: ProvenanceResponse | null;
  argoProfiles: ProfileSummary[];
  importedProfiles: ImportedObservationProfile[];
}

function linePoints(
  stats: Array<{ depth_m: number; value: number }>,
  width: number,
  height: number,
  xMin: number,
  xMax: number,
  depthMin: number,
  depthMax: number
) {
  return stats
    .map(({ depth_m, value }) => {
      const x = 42 + ((value - xMin) / Math.max(xMax - xMin, 1e-12)) * (width - 72);
      const y = 24 + ((depth_m - depthMin) / Math.max(depthMax - depthMin, 1e-12)) * (height - 58);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function DepthTelemetryChart({
  telemetry,
  selectedDepthM
}: {
  telemetry: TelemetryResponse;
  selectedDepthM: number;
}) {
  const width = 720;
  const height = 390;
  const stats = telemetry.depth_stats;
  const xMin = Math.min(...stats.map((item) => item.minimum));
  const xMax = Math.max(...stats.map((item) => item.maximum));
  const depthMin = Math.min(...stats.map((item) => item.depth_m));
  const depthMax = Math.max(...stats.map((item) => item.depth_m));
  const selectedY =
    24 + ((selectedDepthM - depthMin) / Math.max(depthMax - depthMin, 1e-12)) * (height - 58);

  const mean = linePoints(
    stats.map((item) => ({ depth_m: item.depth_m, value: item.mean })),
    width,
    height,
    xMin,
    xMax,
    depthMin,
    depthMax
  );
  const p10 = linePoints(
    stats.map((item) => ({ depth_m: item.depth_m, value: item.p10 })),
    width,
    height,
    xMin,
    xMax,
    depthMin,
    depthMax
  );
  const p90 = linePoints(
    stats.map((item) => ({ depth_m: item.depth_m, value: item.p90 })),
    width,
    height,
    xMin,
    xMax,
    depthMin,
    depthMax
  );

  const band = [
    ...stats.map((item) => ({ depth_m: item.depth_m, value: item.p10 })),
    ...[...stats].reverse().map((item) => ({ depth_m: item.depth_m, value: item.p90 }))
  ];
  const bandPoints = linePoints(band, width, height, xMin, xMax, depthMin, depthMax);

  return (
    <section className="telemetry-card telemetry-depth-card">
      <div className="telemetry-card-heading">
        <div>
          <span>DEPTH TELEMETRY</span>
          <h3>{telemetry.label} through the verified water column</h3>
        </div>
        <strong>{stats.length} genuine depth levels</strong>
      </div>
      <svg
        className="telemetry-depth-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${telemetry.label} full-grid spatial statistics by exact model depth`}
      >
        <line x1="42" x2={width - 30} y1="24" y2="24" className="grid-line" />
        <line x1="42" x2={width - 30} y1={height / 2} y2={height / 2} className="grid-line" />
        <line x1="42" x2={width - 30} y1={height - 34} y2={height - 34} className="grid-line" />
        <polygon points={bandPoints} className="telemetry-percentile-band" />
        <polyline points={p10} className="telemetry-percentile-line" />
        <polyline points={p90} className="telemetry-percentile-line" />
        <polyline points={mean} className="telemetry-mean-line" />
        <line
          x1="42"
          x2={width - 30}
          y1={selectedY}
          y2={selectedY}
          className="telemetry-selected-depth-line"
        />
        <text x="4" y="29" className="telemetry-axis-label">{depthMin.toFixed(2)} m</text>
        <text x="4" y={height - 30} className="telemetry-axis-label">{depthMax.toFixed(1)} m</text>
        <text x="42" y={height - 8} className="telemetry-axis-label">{xMin.toFixed(3)}</text>
        <text x={width - 82} y={height - 8} className="telemetry-axis-label">{xMax.toFixed(3)} {displayUnits(telemetry.units)}</text>
      </svg>
      <div className="telemetry-chart-legend">
        <span><i className="mean" /> Spatial mean</span>
        <span><i className="band" /> 10th–90th percentile</span>
        <span><i className="selected" /> Selected depth</span>
      </div>
      <p>
        Each depth statistic uses all finite model grid cells at that exact depth for the selected
        genuine timestamp. Depth is positive downward.
      </p>
    </section>
  );
}

function DepthLadder({
  telemetry,
  selectedDepthIndex,
  onSelectDepth
}: {
  telemetry: TelemetryResponse;
  selectedDepthIndex: number;
  onSelectDepth: (depthIndex: number) => void;
}) {
  const means = telemetry.depth_stats.map((item) => item.mean);
  const minMean = Math.min(...means);
  const maxMean = Math.max(...means);
  const span = Math.max(maxMean - minMean, 1e-12);

  return (
    <section className="telemetry-card telemetry-depth-ladder">
      <div className="telemetry-card-heading">
        <div>
          <span>INTERACTIVE WATER-COLUMN INDEX</span>
          <h3>Jump to any verified model depth</h3>
        </div>
        <strong>{telemetry.depth_stats.length} exact levels</strong>
      </div>
      <p>
        Each button is one genuine GLORYS12V1 model depth. Bar length shows the full-grid spatial
        mean at that level; selecting a level updates all telemetry cards together.
      </p>
      <div className="telemetry-depth-ladder-grid" role="group" aria-label="Verified telemetry depths">
        {telemetry.depth_stats.map((item) => {
          const width = 14 + 86 * ((item.mean - minMean) / span);
          const selected = item.depth_index === selectedDepthIndex;
          return (
            <button
              key={item.depth_index}
              type="button"
              className={selected ? "active" : ""}
              aria-pressed={selected}
              aria-label={`Select telemetry depth ${item.depth_m.toFixed(2)} m`}
              onClick={() => onSelectDepth(item.depth_index)}
            >
              <span>{item.depth_m.toFixed(item.depth_m < 100 ? 1 : 0)} m</span>
              <i><b style={{ width: `${width}%` }} /></i>
              <strong>{item.mean.toFixed(3)}</strong>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DepthNeighborhood({
  telemetry,
  selectedDepthIndex
}: {
  telemetry: TelemetryResponse;
  selectedDepthIndex: number;
}) {
  const selectedPosition = telemetry.depth_stats.findIndex((item) => item.depth_index === selectedDepthIndex);
  const current = selectedPosition >= 0 ? telemetry.depth_stats[selectedPosition] : null;
  if (!current) return null;

  const previous = selectedPosition > 0 ? telemetry.depth_stats[selectedPosition - 1] : null;
  const next = selectedPosition < telemetry.depth_stats.length - 1
    ? telemetry.depth_stats[selectedPosition + 1]
    : null;

  let gradient: number | null = null;
  let gradientSpan = "";
  if (previous && next) {
    gradient = (next.mean - previous.mean) / Math.max(next.depth_m - previous.depth_m, 1e-12);
    gradientSpan = `${previous.depth_m.toFixed(1)}–${next.depth_m.toFixed(1)} m central difference`;
  } else if (next) {
    gradient = (next.mean - current.mean) / Math.max(next.depth_m - current.depth_m, 1e-12);
    gradientSpan = `${current.depth_m.toFixed(1)}–${next.depth_m.toFixed(1)} m one-sided difference`;
  } else if (previous) {
    gradient = (current.mean - previous.mean) / Math.max(current.depth_m - previous.depth_m, 1e-12);
    gradientSpan = `${previous.depth_m.toFixed(1)}–${current.depth_m.toFixed(1)} m one-sided difference`;
  }

  const rows = [previous, current, next].filter((item): item is TelemetryDepthStat => Boolean(item));

  return (
    <section className="telemetry-card telemetry-neighborhood-card">
      <div className="telemetry-card-heading">
        <div>
          <span>LOCAL VERTICAL CONTEXT</span>
          <h3>Selected layer and nearest genuine depths</h3>
        </div>
        <strong>{current.depth_m.toFixed(2)} m</strong>
      </div>

      <div className="telemetry-neighborhood-metrics">
        <article>
          <span>Local mean gradient</span>
          <strong>{gradient == null ? "—" : `${gradient >= 0 ? "+" : ""}${gradient.toExponential(3)} ${displayUnits(telemetry.units)}/m`}</strong>
          <small>{gradientSpan || "Insufficient neighbouring level"}</small>
        </article>
        <article>
          <span>Selected P10–P90 span</span>
          <strong>{(current.p90 - current.p10).toFixed(4)} {displayUnits(telemetry.units)}</strong>
          <small>spatial percentile spread at this exact depth</small>
        </article>
        <article>
          <span>Selected coefficient of variation</span>
          <strong>{Math.abs(current.mean) > 1e-12 ? (100 * current.std / Math.abs(current.mean)).toFixed(2) : "—"}%</strong>
          <small>std / |mean| · descriptive only</small>
        </article>
      </div>

      <div className="telemetry-neighborhood-table-wrap">
        <table className="telemetry-neighborhood-table">
          <thead>
            <tr>
              <th>Layer</th>
              <th>Depth</th>
              <th>Mean</th>
              <th>P10–P90</th>
              <th>Std</th>
              <th>Finite cells</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.depth_index} className={item.depth_index === current.depth_index ? "selected" : ""}>
                <td>{item.depth_index === current.depth_index ? "SELECTED" : item.depth_m < current.depth_m ? "ABOVE" : "BELOW"}</td>
                <td>{item.depth_m.toFixed(2)} m</td>
                <td>{item.mean.toFixed(4)} {displayUnits(telemetry.units)}</td>
                <td>{item.p10.toFixed(4)}–{item.p90.toFixed(4)}</td>
                <td>{item.std.toFixed(4)}</td>
                <td>{item.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="telemetry-neighborhood-note">
        The gradient is calculated only between adjacent genuine model depth levels. It is a
        descriptive vertical-change diagnostic, not a new measurement or interpolated layer.
      </p>
    </section>
  );
}

function SelectedDepthCard({
  stat,
  telemetry
}: {
  stat: TelemetryDepthStat;
  telemetry: TelemetryResponse;
}) {
  const span = Math.max(stat.maximum - stat.minimum, 1e-12);
  const position = (value: number) => ((value - stat.minimum) / span) * 100;

  return (
    <section className="telemetry-card telemetry-selected-card">
      <div className="telemetry-card-heading compact">
        <div>
          <span>SELECTED DEPTH DISTRIBUTION</span>
          <h3>{stat.depth_m.toFixed(2)} m</h3>
        </div>
        <strong>{stat.count.toLocaleString()} finite cells</strong>
      </div>
      <div className="telemetry-range-track" aria-label="Selected depth distribution summary">
        <div
          className="telemetry-range-band"
          style={{ left: `${position(stat.p10)}%`, width: `${Math.max(1, position(stat.p90) - position(stat.p10))}%` }}
        />
        <i className="p50" style={{ left: `${position(stat.p50)}%` }} />
        <i className="mean" style={{ left: `${position(stat.mean)}%` }} />
      </div>
      <div className="telemetry-range-labels">
        <span>Min <strong>{stat.minimum.toFixed(3)}</strong></span>
        <span>P10 <strong>{stat.p10.toFixed(3)}</strong></span>
        <span>Median <strong>{stat.p50.toFixed(3)}</strong></span>
        <span>P90 <strong>{stat.p90.toFixed(3)}</strong></span>
        <span>Max <strong>{stat.maximum.toFixed(3)}</strong></span>
      </div>
      <div className="telemetry-selected-metrics">
        <article><span>Spatial mean</span><strong>{stat.mean.toFixed(4)} {displayUnits(telemetry.units)}</strong></article>
        <article><span>Std. deviation</span><strong>{stat.std.toFixed(4)} {displayUnits(telemetry.units)}</strong></article>
      </div>
    </section>
  );
}

function TimeTelemetryCard({ telemetry }: { telemetry: TelemetryResponse }) {
  const width = 620;
  const height = 220;
  const stats = telemetry.time_stats;
  const means = stats.map((item) => item.mean);
  const yMin = Math.min(...stats.map((item) => item.minimum));
  const yMax = Math.max(...stats.map((item) => item.maximum));

  const points = stats
    .map((item, index) => {
      const x =
        stats.length === 1
          ? width / 2
          : 38 + (index / Math.max(stats.length - 1, 1)) * (width - 76);
      const y =
        24 + ((yMax - item.mean) / Math.max(yMax - yMin, 1e-12)) * (height - 58);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <section className="telemetry-card telemetry-time-card">
      <div className="telemetry-card-heading">
        <div>
          <span>TIME TELEMETRY</span>
          <h3>Spatial mean at {telemetry.selected_depth_m.toFixed(2)} m</h3>
        </div>
        <strong>{stats.length} genuine timestamp{stats.length === 1 ? "" : "s"}</strong>
      </div>
      <div className="telemetry-time-plot">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Genuine model time telemetry">
          <line x1="38" x2={width - 38} y1={height - 34} y2={height - 34} className="grid-line" />
          {stats.length > 1 && <polyline points={points} className="telemetry-time-line" />}
          {stats.map((item, index) => {
            const [x, y] = points.split(" ")[index].split(",").map(Number);
            return <circle key={item.time} cx={x} cy={y} r="5" className="telemetry-time-point" />;
          })}
          <text x="38" y={height - 10} className="telemetry-axis-label">
            {stats[0]?.time.replace("T00:00:00Z", "")}
          </text>
          {stats.length > 1 && (
            <text x={width - 112} y={height - 10} className="telemetry-axis-label">
              {stats.at(-1)?.time.replace("T00:00:00Z", "")}
            </text>
          )}
        </svg>
        {!telemetry.time_series_available && (
          <div className="telemetry-time-lock">
            <strong>TIME SERIES LOCKED</strong>
            <span>
              One verified model timestamp is bundled. Ocean Canvas shows that real point and does not
              synthesize a second timestamp or trend.
            </span>
          </div>
        )}
      </div>
      {telemetry.time_series_available && (
        <p>
          Genuine model timestamps only. Displayed values are full-grid spatial means at the selected exact depth.
        </p>
      )}
      <div className="telemetry-time-values">
        {stats.map((item: TelemetryTimeStat) => (
          <article key={item.time}>
            <span>{item.time.replace("T", " ").replace("Z", " UTC")}</span>
            <strong>{item.mean.toFixed(4)} {displayUnits(telemetry.units)}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function CurrentTelemetryCard({ telemetry }: { telemetry: TelemetryResponse }) {
  const current = telemetry.current_summary;
  return (
    <section className="telemetry-card telemetry-current-card">
      <div className="telemetry-card-heading compact">
        <div>
          <span>HORIZONTAL CURRENT TELEMETRY</span>
          <h3>Full-grid u/v summary at {telemetry.selected_depth_m.toFixed(2)} m</h3>
        </div>
        <strong>{current ? current.count.toLocaleString() : "—"} vectors</strong>
      </div>
      {current ? (
        <>
          <div className="telemetry-current-vector">
            <div
              className="telemetry-current-arrow"
              style={{
                transform: `rotate(${Math.atan2(current.mean_v, current.mean_u) * (180 / Math.PI)}deg)`
              }}
              aria-hidden="true"
            >→</div>
            <div>
              <span>Vector-mean components</span>
              <strong>u {current.mean_u.toFixed(4)} · v {current.mean_v.toFixed(4)} {current.units}</strong>
            </div>
          </div>
          <div className="telemetry-current-metrics">
            <article><span>Mean speed</span><strong>{current.mean_speed.toFixed(4)} {current.units}</strong></article>
            <article><span>Maximum speed</span><strong>{current.maximum_speed.toFixed(4)} {current.units}</strong></article>
          </div>
          <p>Horizontal components only. Ocean Canvas does not invent a vertical current component.</p>
        </>
      ) : (
        <div className="telemetry-inline-warning">Verified horizontal current components are unavailable.</div>
      )}
    </section>
  );
}

function downloadTelemetryCsv(telemetry: TelemetryResponse) {
  const header = [
    "depth_index",
    "depth_m",
    "count",
    "mean",
    "minimum",
    "p10",
    "median_p50",
    "p90",
    "maximum",
    "std",
    "units",
    "time_utc"
  ];
  const rows = telemetry.depth_stats.map((item) => [
    item.depth_index,
    item.depth_m,
    item.count,
    item.mean,
    item.minimum,
    item.p10,
    item.p50,
    item.p90,
    item.maximum,
    item.std,
    telemetry.units,
    telemetry.time
  ]);
  const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `OceanCanvas_${telemetry.variable}_depth_telemetry_t${telemetry.time_index}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function TelemetrySensors({
  argoProfiles,
  importedProfiles
}: {
  argoProfiles: ProfileSummary[];
  importedProfiles: ImportedObservationProfile[];
}) {
  const importedGroups = [
    { id: "glider", label: "Glider" },
    { id: "ctd", label: "CTD / XCTD" },
    { id: "bgc", label: "BGC" },
    { id: "other", label: "Other" }
  ].map((group) => {
    const profiles = importedProfiles.filter((profile) => profile.sensor_type === group.id);
    return {
      ...group,
      profiles,
      measurements: profiles.reduce((sum, profile) => sum + profile.records.length, 0)
    };
  }).filter((group) => group.profiles.length > 0);

  const importedMeasurementCount = importedProfiles.reduce((sum, profile) => sum + profile.records.length, 0);

  return (
    <section
      className="telemetry-card telemetry-sensors-card"
      data-testid="rui-nav-03-sensors"
      data-imported-profile-count={importedProfiles.length}
      data-argo-profile-count={argoProfiles.length}
    >
      <div className="telemetry-card-heading">
        <div>
          <span>SENSORS</span>
          <h3>Observation profiles available to Ocean Canvas</h3>
        </div>
        <strong>{argoProfiles.length + importedProfiles.length} profiles</strong>
      </div>

      <p>
        This directory inventories the existing observation evidence only. Values remain source supplied
        after validation; Telemetry does not reinterpret these profiles as independent model validation.
      </p>

      <div className="telemetry-sensor-grid">
        <article>
          <span>ARGO MATCHUPS</span>
          <strong>{argoProfiles.length}</strong>
          <small>eligible comparison profiles · detailed matchup science remains in Model vs Observation</small>
        </article>
        {importedGroups.map((group) => (
          <article key={group.id}>
            <span>{group.label.toUpperCase()}</span>
            <strong>{group.profiles.length}</strong>
            <small>{group.measurements.toLocaleString()} validated measurement rows</small>
          </article>
        ))}
      </div>

      {importedProfiles.length > 0 ? (
        <div className="telemetry-sensor-list" aria-label="Telemetry observation profiles">
          {importedProfiles.slice(0, 8).map((profile) => (
            <article key={profile.id}>
              <div>
                <span>{profile.sensor_type.toUpperCase()}</span>
                <strong>{profile.platform_id}</strong>
              </div>
              <small>{profile.records.length} rows · {profile.variables.join(" · ")} · {profile.source}</small>
            </article>
          ))}
          {importedProfiles.length > 8 && (
            <p>+ {importedProfiles.length - 8} additional shared observation profiles remain available to the Explorer observation layer.</p>
          )}
        </div>
      ) : (
        <div className="telemetry-inline-warning">
          Verified Glider / CTD / BGC profiles are not available in this runtime. No placeholder measurements are created.
        </div>
      )}

      <div className="telemetry-sensor-integrity">
        <span>IMPORTED MEASUREMENTS</span>
        <strong>{importedMeasurementCount.toLocaleString()}</strong>
        <small>source values preserved · no synthetic measurements or timestamps</small>
      </div>
    </section>
  );
}
export function TelemetryPage({ catalog, provenance, argoProfiles, importedProfiles }: Props) {
  const initialContext = useMemo(() => readScientificWorkspaceContext(), []);
  const initialDepthIndex = Math.min(
    Math.max(initialContext.depthIndex ?? 18, 0),
    Math.max(0, catalog.coordinates.depth.length - 1)
  );
  const initialTimeIndex = resolveTimeIndex(catalog.coordinates.time, initialContext.timestamp) ?? 0;
  const [variable, setVariable] = useState<"thetao" | "so">(initialContext.variable === "so" ? "so" : "thetao");
  const [depthIndex, setDepthIndex] = useState(initialDepthIndex);
  const [timeIndex, setTimeIndex] = useState(initialTimeIndex);
  const [telemetry, setTelemetry] = useState<TelemetryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timestamp = catalog.coordinates.time[timeIndex] ?? null;
    publishScientificWorkspaceContext({
      sourceMode: "glorys",
      variable,
      depthIndex,
      depthM: catalog.coordinates.depth[depthIndex] ?? null,
      timestamp,
      timeIndex: timestamp ? timeIndex : null,
      timeKind: timestamp ? "native" : "unavailable",
      origin: "telemetry"
    });
  }, [catalog.coordinates.depth, catalog.coordinates.time, depthIndex, timeIndex, variable]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api.telemetry(variable, timeIndex, depthIndex)
      .then((payload) => {
        if (!cancelled) setTelemetry(payload);
      })
      .catch((reason: Error) => {
        if (!cancelled) {
          setTelemetry(null);
          setError(reason.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [variable, timeIndex, depthIndex]);

  const selectedStat = useMemo(() => {
    if (!telemetry) return null;
    return telemetry.depth_stats.find((item) => item.depth_index === depthIndex) ?? null;
  }, [telemetry, depthIndex]);

  const longitude = catalog.coordinates.longitude;
  const latitude = catalog.coordinates.latitude;

  return (
    <main
      className="telemetry-page"
      data-page="telemetry"
      data-variable={variable}
      data-depth-count={telemetry?.depth_stats.length ?? 0}
      data-time-count={telemetry?.time_stats.length ?? 0}
      data-selected-depth={telemetry?.selected_depth_m.toFixed(2) ?? ""}
    >
      <section className="telemetry-hero">
        <div>
          <div className="section-kicker">OCEAN ANALYTICS · EXPLAINABLE OPERATIONS</div>
          <h2>Depth & telemetry workspace</h2>
          <p>
            Read the ocean vertically, temporally and operationally. Ocean Canvas turns the verified
            GLORYS water column into explainable depth statistics, then places genuine INCOIS
            multi-time analysis beside it so anyone can see exactly which evidence is static,
            which evidence changes through time, and why no synthetic timestamp is required.
          </p>
        </div>
        <div className="telemetry-source-card">
          <span>VERIFIED WINDOW</span>
          <strong>{catalog.dataset.product}</strong>
          <small>
            {longitude[0].toFixed(2)}–{longitude.at(-1)?.toFixed(2)}°E ·
            {" "}{latitude[0].toFixed(2)}–{latitude.at(-1)?.toFixed(2)}°N
          </small>
          <small>{catalog.dataset.freshness_class} · {catalog.dataset.runtime_mode}</small>
        </div>
      </section>

      <section className="telemetry-reading-guide" aria-label="How to read the telemetry workspace">
        <article>
          <span>01 · WATER COLUMN</span>
          <strong>31 genuine model depth levels</strong>
          <p>Follow full-grid temperature or salinity statistics from the near-surface layer to the deepest verified GLORYS level.</p>
        </article>
        <article>
          <span>02 · OPERATIONAL TIME</span>
          <strong>INCOIS provides genuine temporal breadth</strong>
          <p>Use real INCOIS timestamps to demonstrate change through time without pretending the one-time GLORYS baseline is an animation.</p>
        </article>
        <article>
          <span>03 · EXPLAINABILITY</span>
          <strong>Every derived summary keeps its evidence trail</strong>
          <p>Depth, units, spatial grid, source identity and method remain visible so the visualization can be defended scientifically.</p>
        </article>
      </section>

      <IncoisOperationalPanel />

      <section className="telemetry-toolbar">
        <div>
          <span>Scalar telemetry</span>
          <div className="telemetry-variable-switcher" aria-label="Telemetry variable">
            <button
              className={variable === "thetao" ? "active" : ""}
              onClick={() => setVariable("thetao")}
              aria-label="Temperature telemetry"
            >
              Temperature
            </button>
            <button
              className={variable === "so" ? "active" : ""}
              onClick={() => setVariable("so")}
              aria-label="Salinity telemetry"
            >
              Salinity
            </button>
          </div>
        </div>
        <label>
          <span>Telemetry depth <strong>{(catalog.coordinates.depth[depthIndex] ?? 0).toFixed(2)} m</strong></span>
          <input
            aria-label="Telemetry depth"
            type="range"
            min={0}
            max={catalog.coordinates.depth.length - 1}
            value={depthIndex}
            onChange={(event) => setDepthIndex(Number(event.target.value))}
          />
        </label>
        <label>
          <span>Genuine timestamp <strong>{catalog.coordinates.time[timeIndex]?.replace("T00:00:00Z", "")}</strong></span>
          <input
            aria-label="Telemetry time"
            type="range"
            min={0}
            max={Math.max(0, catalog.coordinates.time.length - 1)}
            value={timeIndex}
            disabled={catalog.coordinates.time.length < 2}
            onChange={(event) => setTimeIndex(Number(event.target.value))}
          />
        </label>
        <button
          type="button"
          className="telemetry-download"
          disabled={!telemetry}
          onClick={() => telemetry && downloadTelemetryCsv(telemetry)}
        >
          Download depth telemetry CSV
        </button>
      </section>

      {loading && !telemetry ? (
        <section className="telemetry-state-card">Loading full-grid telemetry…</section>
      ) : error ? (
        <section className="telemetry-state-card error">
          <strong>Telemetry unavailable</strong>
          <span>{error}</span>
        </section>
      ) : telemetry && selectedStat ? (
        <>
          <section className="telemetry-overview">
            <article>
              <span>Depth levels</span>
              <strong>{telemetry.depth_stats.length}</strong>
              <small>genuine model depths</small>
            </article>
            <article>
              <span>Time steps</span>
              <strong>{telemetry.time_stats.length}</strong>
              <small>genuine timestamps</small>
            </article>
            <article>
              <span>Grid</span>
              <strong>{telemetry.spatial_grid.longitude_count} × {telemetry.spatial_grid.latitude_count}</strong>
              <small>full horizontal grid</small>
            </article>
            <article>
              <span>Selected depth</span>
              <strong>{telemetry.selected_depth_m.toFixed(2)} m</strong>
              <small>positive downward</small>
            </article>
            <article>
              <span>Variable</span>
              <strong>{telemetry.label}</strong>
              <small>{displayUnits(telemetry.units)}</small>
            </article>
          </section>

          <DepthLadder
            telemetry={telemetry}
            selectedDepthIndex={depthIndex}
            onSelectDepth={setDepthIndex}
          />

          <section className="telemetry-main-grid">
            <DepthTelemetryChart telemetry={telemetry} selectedDepthM={telemetry.selected_depth_m} />
            <div className="telemetry-side-stack">
              <SelectedDepthCard stat={selectedStat} telemetry={telemetry} />
              <CurrentTelemetryCard telemetry={telemetry} />
            </div>
          </section>

          <DepthNeighborhood telemetry={telemetry} selectedDepthIndex={depthIndex} />

          <TimeTelemetryCard telemetry={telemetry} />

          <section className="telemetry-method-card">
            <div>
              <span>STATISTIC DEFINITION</span>
              <strong>Full-grid finite-cell summaries</strong>
            </div>
            <p>{telemetry.statistic_definition}</p>
            <dl>
              <div><dt>Dataset</dt><dd>{telemetry.provenance.dataset_id}</dd></div>
              <div><dt>Product</dt><dd>{telemetry.provenance.product}</dd></div>
              <div><dt>Runtime</dt><dd>{telemetry.provenance.runtime_mode}</dd></div>
              <div><dt>Model DOI</dt><dd>{provenance?.model.doi ?? catalog.dataset.doi}</dd></div>
            </dl>
          </section>
        </>
      ) : null}
    </main>
  );
}
