import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { AnomalyDirectoryNav } from "../components/AnomalyDirectoryNav";
import type { AnomalyResponse, Catalog, ResidualAnomalyFlag, SpatialAnomalyFlag } from "../types";
import { displayUnits } from "../units";
import { resolveTimeIndex } from "../time-engine";
import { publishScientificWorkspaceContext, readScientificWorkspaceContext } from "../scientific-context-runtime";

interface Props { catalog: Catalog; }

type FocusScreen = "spatial" | "residual";

function magnitudeBand(robustZ: number): { label: string; key: string } {
  const magnitude = Math.abs(robustZ);
  if (magnitude >= 6) return { label: "Very strong deviation", key: "very-strong" };
  if (magnitude >= 4.5) return { label: "Strong deviation", key: "strong" };
  return { label: "Threshold crossing", key: "threshold" };
}

function downloadScreeningEvidence(payload: AnomalyResponse) {
  const exportPayload = {
    exported_by: "Ocean Canvas · Explainable Anomaly Screening",
    exported_utc: new Date().toISOString(),
    interpretation_guardrail: payload.interpretation,
    method: payload.method,
    selected_model_context: {
      variable: payload.variable,
      label: payload.label,
      units: payload.units,
      time: payload.time,
      depth_m: payload.depth_m
    },
    spatial_screen: payload.spatial_screen,
    residual_screen: payload.residual_screen,
    temporal_screen: payload.temporal_screen,
    provenance: payload.provenance
  };
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `OceanCanvas_anomaly_screen_${payload.variable}_d${payload.depth_index}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function AnomalyPage({ catalog }: Props) {
  const initialContext = useMemo(() => readScientificWorkspaceContext(), []);
  const initialDepthIndex = Math.min(
    Math.max(initialContext.depthIndex ?? 18, 0),
    Math.max(0, catalog.coordinates.depth.length - 1)
  );
  const initialTimeIndex = resolveTimeIndex(catalog.coordinates.time, initialContext.timestamp) ?? 0;
  const [variable, setVariable] = useState<"thetao" | "so">(initialContext.variable === "so" ? "so" : "thetao");
  const [depthIndex, setDepthIndex] = useState(initialDepthIndex);
  const [timeIndex, setTimeIndex] = useState(initialTimeIndex);
  const [payload, setPayload] = useState<AnomalyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [focusScreen, setFocusScreen] = useState<FocusScreen>("spatial");

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
      origin: "anomaly"
    });
  }, [catalog.coordinates.depth, catalog.coordinates.time, depthIndex, timeIndex, variable]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api.anomalies(variable, timeIndex, depthIndex)
      .then((value) => { if (!cancelled) setPayload(value); })
      .catch((reason: Error) => { if (!cancelled) { setPayload(null); setError(reason.message); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [variable, timeIndex, depthIndex]);

  const depth = catalog.coordinates.depth[depthIndex] ?? 0;
  const spatial = useMemo(() => payload?.spatial_screen.flags.slice(0, 12) ?? [], [payload]);
  const residual = useMemo(() => payload?.residual_screen.flags.slice(0, 16) ?? [], [payload]);
  const strongestSpatial = useMemo(() =>
    payload?.spatial_screen.flags.reduce<SpatialAnomalyFlag | null>(
      (best, flag) => !best || Math.abs(flag.robust_z) > Math.abs(best.robust_z) ? flag : best,
      null
    ) ?? null, [payload]);
  const strongestResidual = useMemo(() =>
    payload?.residual_screen.flags.reduce<ResidualAnomalyFlag | null>(
      (best, flag) => !best || Math.abs(flag.robust_z) > Math.abs(best.robust_z) ? flag : best,
      null
    ) ?? null, [payload]);
  const focusedFlag = focusScreen === "spatial" ? strongestSpatial : strongestResidual;
  const threshold = payload?.method.absolute_threshold ?? 3.5;
  const focusedBand = focusedFlag ? magnitudeBand(focusedFlag.robust_z) : null;

  const spatialPlot = useMemo(() => {
    if (!payload || payload.spatial_screen.flags.length === 0) return [];
    const flags = payload.spatial_screen.flags;
    const lons = flags.map((flag) => flag.longitude);
    const lats = flags.map((flag) => flag.latitude);
    const lonMin = Math.min(...lons), lonMax = Math.max(...lons);
    const latMin = Math.min(...lats), latMax = Math.max(...lats);
    const lonSpan = Math.max(lonMax - lonMin, 1e-9);
    const latSpan = Math.max(latMax - latMin, 1e-9);
    return flags.map((flag) => ({
      ...flag,
      x: 8 + ((flag.longitude - lonMin) / lonSpan) * 84,
      y: 92 - ((flag.latitude - latMin) / latSpan) * 84
    }));
  }, [payload]);

  return (
    <main
      className="anomaly-page"
      data-page="anomaly"
      data-variable={variable}
      data-depth-index={depthIndex}
      data-time-index={timeIndex}
      data-residual-flags={payload?.residual_screen.flagged_count ?? 0}
    >
      <AnomalyDirectoryNav />

      <section id="anomaly-overview" className="anomaly-directory-section anomaly-overview-home" data-anomaly-home="overview">
        <header className="anomaly-hero">
          <div>
            <span className="section-kicker">DIAGNOSTIC · EXPLAINABLE SCREENING</span>
            <h2>Anomaly screening</h2>
            <p>
              Robust statistical flags over verified model cells and matched Argo temperature residuals.
              A flag means unusual relative to available evidence—not proof of an ocean event, sensor fault,
              forecast anomaly or independent validation result.
            </p>
          </div>
          <aside className="anomaly-overview-guardrail">
            <span>INTERPRETATION BOUNDARY</span>
            <strong>Detected Flags are statistical screens, not confirmed events</strong>
            <small>No hazard, event severity, sensor-health or operational-risk claim is inferred.</small>
          </aside>
        </header>

        {payload && (
          <section className="anomaly-overview" aria-label="Anomaly screening overview">
            <article><span>Spatial flags</span><strong>{payload.spatial_screen.flagged_count}</strong>
              <small>of {payload.spatial_screen.sample_count} finite model cells</small></article>
            <article><span>Residual flags</span><strong>{payload.residual_screen.flagged_count}</strong>
              <small>of {payload.residual_screen.sample_count} matched Argo levels</small></article>
            <article><span>Profiles screened</span><strong>{payload.residual_screen.profiles_screened}</strong>
              <small>temperature residuals, profile-wise</small></article>
            <article className="locked"><span>Temporal screen</span><strong>LOCKED</strong>
              <small>{payload.temporal_screen.genuine_time_count} genuine timestamp(s)</small></article>
          </section>
        )}
      </section>

      {loading ? (
        <div className="anomaly-state-card">Screening canonical verified evidence…</div>
      ) : error || !payload ? (
        <div className="anomaly-state-card error">{error || "Screen unavailable."}</div>
      ) : (
        <div className="anomaly-explainable-workspace" data-focus-screen={focusScreen}>
          <section id="anomaly-spatial" className="anomaly-directory-section" data-anomaly-home="spatial-anomalies">
            <header className="anomaly-directory-heading">
              <div><span>SPATIAL ANOMALIES</span><h3>Locate threshold-crossing model cells</h3></div>
              <small>Actual model-cell coordinates · fixed robust-z method</small>
            </header>

            <div className="anomaly-context-control anomaly-variable-context">
              <span>ACTIVE SCALAR FIELD</span>
              <div className="anomaly-variable-switcher" aria-label="Anomaly scalar field">
                <button className={variable === "thetao" ? "active" : ""} onClick={() => setVariable("thetao")}>Temperature</button>
                <button className={variable === "so" ? "active" : ""} onClick={() => setVariable("so")}>Salinity</button>
              </div>
              <small>Variable selection changes the requested verified model field; residual evidence remains the bundled temperature matchup screen.</small>
            </div>

            <article className="anomaly-context-card">
              <div className="anomaly-card-heading">
                <div><span>FLAG CONTEXT</span><h3>Flagged-cell constellation</h3></div>
                <strong>{payload.spatial_screen.flagged_count} detected flag(s)</strong>
              </div>
              {spatialPlot.length ? (
                <div className="anomaly-flag-map">
                  <svg viewBox="0 0 100 100" role="img" aria-label="Flagged model cells positioned by actual longitude and latitude">
                    <path d="M8 92H94M8 92V6" className="anomaly-axis" />
                    {spatialPlot.map((flag, index) => (
                      <g key={index}>
                        <circle
                          cx={flag.x}
                          cy={flag.y}
                          r={Math.min(4.8, 1.8 + Math.abs(flag.robust_z) * .35)}
                          className={flag.robust_z >= 0 ? "flag-positive" : "flag-negative"}
                        />
                        <title>{flag.longitude.toFixed(3) + "°E, " + flag.latitude.toFixed(3) + "°N · z " + flag.robust_z.toFixed(2)}</title>
                      </g>
                    ))}
                  </svg>
                  <div className="anomaly-map-axis-labels"><span>Longitude →</span><span>Latitude ↑</span></div>
                  <small>Only threshold-crossing cells are drawn; coordinates remain the actual model-cell lon/lat.</small>
                </div>
              ) : <div className="anomaly-empty">No flagged model cells at this depth.</div>}
            </article>

            <article className="anomaly-card anomaly-spatial-results">
              <div className="anomaly-card-heading"><div><span>MODEL SPACE</span>
                <h3>{payload.label} spatial statistical extremes</h3></div><strong>{payload.depth_m.toFixed(2)} m</strong></div>
              <p className="anomaly-scope">{payload.spatial_screen.scope}</p>
              <div className="anomaly-baseline"><span>Median <strong>{payload.spatial_screen.median.toFixed(4)} {displayUnits(payload.units)}</strong></span>
                <span>MAD <strong>{payload.spatial_screen.mad.toFixed(4)} {displayUnits(payload.units)}</strong></span></div>
              {spatial.length === 0 ? <div className="anomaly-empty">No model cell crosses the fixed |robust z| ≥ 3.5 threshold here.</div> :
                <div className="anomaly-table-wrap"><table className="anomaly-spatial-table"><thead><tr>
                  <th>Lon</th><th>Lat</th><th>Value</th><th>Robust z</th></tr></thead><tbody>
                  {spatial.map((flag, i) => <tr key={i}><td>{flag.longitude.toFixed(3)}°E</td>
                    <td>{flag.latitude.toFixed(3)}°N</td><td>{flag.value.toFixed(4)} {displayUnits(payload.units)}</td>
                    <td className={flag.robust_z >= 0 ? "positive" : "negative"}>{flag.robust_z.toFixed(2)}</td></tr>)}
                </tbody></table></div>}
            </article>
          </section>

          <section id="anomaly-temporal" className="anomaly-directory-section" data-anomaly-home="temporal-anomalies">
            <header className="anomaly-directory-heading">
              <div><span>TEMPORAL ANOMALIES</span><h3>Use genuine source time or fail closed</h3></div>
              <small>No synthetic timestamps or fabricated temporal screen</small>
            </header>
            <div className="anomaly-context-control anomaly-time-control">
              <label><span>Genuine timestamp</span>
                <strong>{catalog.coordinates.time[timeIndex]?.replace("T00:00:00Z", "") ?? "Unavailable"}</strong>
                <input aria-label="Anomaly time" type="range" min={0}
                  max={Math.max(0, catalog.coordinates.time.length - 1)} value={timeIndex}
                  disabled={catalog.coordinates.time.length < 2}
                  onChange={(event) => setTimeIndex(Number(event.target.value))} />
                <small>{catalog.coordinates.time.length} genuine timestamp(s) · native only</small>
              </label>
            </div>
            <article className="anomaly-card anomaly-temporal-card"><span>TEMPORAL SCREEN LOCKED</span>
              <h3>No synthetic time-series anomaly detection</h3><p>{payload.temporal_screen.reason}</p></article>
          </section>

          <section id="anomaly-depth" className="anomaly-directory-section" data-anomaly-home="depth-anomalies">
            <header className="anomaly-directory-heading">
              <div><span>DEPTH ANOMALIES</span><h3>Residual flags at exact retained model depths</h3></div>
              <small>Positive downward · no interpolated screening depth</small>
            </header>
            <div className="anomaly-context-control">
              <label><span>Exact model depth</span><strong>{depth.toFixed(2)} m</strong>
                <input aria-label="Anomaly depth" type="range" min={0} max={catalog.coordinates.depth.length - 1}
                  value={depthIndex} onChange={(event) => setDepthIndex(Number(event.target.value))} />
              </label>
              <small>Selects an existing model depth index from the shared scientific context.</small>
            </div>

            <article className="anomaly-card">
              <div className="anomaly-card-heading"><div><span>DEPTH EVIDENCE</span>
                <h3>Residual flags by depth</h3></div><strong>Model − Observation</strong></div>
              {residual.length ? (
                <div className="anomaly-residual-ranks">
                  {[...residual].sort((a, b) => Math.abs(b.robust_z) - Math.abs(a.robust_z)).slice(0, 8).map((flag, index) => (
                    <div key={index}>
                      <span>{flag.observation_depth_m.toFixed(1)} m</span>
                      <div><i style={{ width: Math.min(100, Math.abs(flag.robust_z) / 8 * 100) + "%" }} /></div>
                      <strong>{flag.robust_z.toFixed(2)}</strong>
                    </div>
                  ))}
                  <small>Bar length encodes |robust z| for flagged, verified Argo matched levels only.</small>
                </div>
              ) : <div className="anomaly-empty">No flagged residuals are available.</div>}
            </article>

            <article className="anomaly-card anomaly-depth-results">
              <div className="anomaly-card-heading"><div><span>OBSERVATION RESIDUALS</span>
                <h3>Argo model–observation residual outliers</h3></div><strong>Model − Observation</strong></div>
              <p className="anomaly-scope">{payload.residual_screen.scope}. Temperature-only because that is the bundled verified Argo comparison evidence.</p>
              <div className="anomaly-profile-stats">
                {payload.residual_screen.profile_statistics.map((p) => <div key={p.profile_id}>
                  <span>Argo {p.platform_id} · cycle {p.cycle}</span><strong>{p.flagged_count} flag(s)</strong>
                  <small>median {p.median_bias_celsius.toFixed(3)} °C · MAD {p.mad_bias_celsius.toFixed(3)} °C</small></div>)}
              </div>
              <div className="anomaly-table-wrap"><table className="anomaly-residual-table"><thead><tr>
                <th>Profile</th><th>Depth</th><th>Bias</th><th>|error|</th><th>Robust z</th></tr></thead><tbody>
                {residual.map((flag, i) => <tr key={i}><td>{flag.platform_id} / {flag.cycle}</td>
                  <td>{flag.observation_depth_m.toFixed(1)} m</td><td>{flag.signed_bias_celsius.toFixed(3)} °C</td>
                  <td>{flag.absolute_error_celsius.toFixed(3)} °C</td>
                  <td className={flag.robust_z >= 0 ? "positive" : "negative"}>{flag.robust_z.toFixed(2)}</td></tr>)}
              </tbody></table></div>
            </article>
          </section>

          <section id="anomaly-thresholds" className="anomaly-directory-section" data-anomaly-home="thresholds">
            <header className="anomaly-directory-heading">
              <div><span>THRESHOLDS</span><h3>Fixed robust-z screening contract</h3></div>
              <small>Deterministic · median/MAD · two-sided</small>
            </header>
            <div className="anomaly-threshold-grid">
              <aside className="anomaly-method-chip">
                <span>FIXED METHOD</span><strong>|robust z| ≥ 3.5</strong>
                <small>Median / MAD · two-sided · deterministic</small>
              </aside>
              <article className="anomaly-card anomaly-method-card"><span>METHOD & THRESHOLD</span>
                <h3>{payload.method.name}</h3><code>{payload.method.formula}</code>
                <p>Two-sided flag rule: |robust z| ≥ {payload.method.absolute_threshold}. {payload.method.zero_mad_policy}.</p></article>
            </div>
          </section>

          <section id="anomaly-detected-flags" className="anomaly-directory-section" data-anomaly-home="detected-flags">
            <header className="anomaly-directory-heading">
              <div><span>DETECTED FLAGS</span><h3>Review and export statistical threshold crossings</h3></div>
              <small>Flags are not confirmed events</small>
            </header>
            <div className="anomaly-detected-grid">
              <article><span>MODEL CELLS</span><strong>{payload.spatial_screen.flagged_count}</strong><small>of {payload.spatial_screen.sample_count} finite cells</small></article>
              <article><span>ARGO RESIDUALS</span><strong>{payload.residual_screen.flagged_count}</strong><small>of {payload.residual_screen.sample_count} matched levels</small></article>
              <article><span>PROFILES</span><strong>{payload.residual_screen.profiles_screened}</strong><small>profile-wise residual screens</small></article>
            </div>
            <div className="anomaly-detected-actions">
              <p>Export contains the selected scientific context, both detected-flag screens, temporal capability state, method and provenance.</p>
              <button type="button" className="anomaly-download" onClick={() => downloadScreeningEvidence(payload)}>
                Download screening evidence
              </button>
            </div>
          </section>

          <section id="anomaly-explainability" className="anomaly-directory-section" data-anomaly-home="explainability">
            <header className="anomaly-directory-heading">
              <div><span>EXPLAINABILITY</span><h3>Why is this point flagged?</h3></div>
              <small>Threshold margin + source values + interpretation boundary</small>
            </header>
            <article className="anomaly-focus-card">
              <div className="anomaly-focus-heading">
                <div><span>EXPLAINABLE FLAG INSPECTOR</span><h3>Why is this point flagged?</h3></div>
                <div className="anomaly-focus-switcher" aria-label="Anomaly evidence focus">
                  <button className={focusScreen === "spatial" ? "active" : ""} onClick={() => setFocusScreen("spatial")}>Model cell</button>
                  <button className={focusScreen === "residual" ? "active" : ""} onClick={() => setFocusScreen("residual")}>Argo residual</button>
                </div>
              </div>

              {focusedFlag && focusedBand ? (
                <div className="anomaly-focus-body">
                  <div className="anomaly-z-orbit">
                    <div className="anomaly-z-score">
                      <span>ROBUST Z</span>
                      <strong>{focusedFlag.robust_z.toFixed(2)}</strong>
                      <small className={focusedBand.key}>{focusedBand.label}</small>
                    </div>
                    <div className="anomaly-threshold-rail" aria-label="Robust z threshold margin">
                      <span className="rail-threshold" style={{ left: Math.min(100, threshold / 8 * 100) + "%" }} />
                      <span className="rail-value" style={{ width: Math.min(100, Math.abs(focusedFlag.robust_z) / 8 * 100) + "%" }} />
                    </div>
                    <small>|z| exceeds the fixed threshold by {(Math.abs(focusedFlag.robust_z) - threshold).toFixed(2)} robust-z units.</small>
                  </div>

                  {focusScreen === "spatial" && strongestSpatial ? (
                    <dl className="anomaly-why-grid">
                      <div><dt>Actual value</dt><dd>{strongestSpatial.value.toFixed(4)} {displayUnits(payload.units)}</dd></div>
                      <div><dt>Layer median</dt><dd>{payload.spatial_screen.median.toFixed(4)} {displayUnits(payload.units)}</dd></div>
                      <div><dt>Layer MAD</dt><dd>{payload.spatial_screen.mad.toFixed(4)} {displayUnits(payload.units)}</dd></div>
                      <div><dt>Signed difference</dt><dd>{(strongestSpatial.value - payload.spatial_screen.median).toFixed(4)} {displayUnits(payload.units)}</dd></div>
                      <div><dt>Longitude</dt><dd>{strongestSpatial.longitude.toFixed(3)}°E</dd></div>
                      <div><dt>Latitude</dt><dd>{strongestSpatial.latitude.toFixed(3)}°N</dd></div>
                    </dl>
                  ) : strongestResidual ? (
                    <dl className="anomaly-why-grid">
                      <div><dt>Depth</dt><dd>{strongestResidual.observation_depth_m.toFixed(1)} m</dd></div>
                      <div><dt>Model − obs</dt><dd>{strongestResidual.signed_bias_celsius.toFixed(3)} °C</dd></div>
                      <div><dt>Absolute error</dt><dd>{strongestResidual.absolute_error_celsius.toFixed(3)} °C</dd></div>
                      <div><dt>Argo platform</dt><dd>{strongestResidual.platform_id}</dd></div>
                      <div><dt>Cycle</dt><dd>{strongestResidual.cycle}</dd></div>
                      <div><dt>Screen</dt><dd>Within-profile residual</dd></div>
                    </dl>
                  ) : null}
                </div>
              ) : (
                <div className="anomaly-empty">No flag is available for this evidence screen at the selected context.</div>
              )}
              <div className="anomaly-inspector-guardrail">
                Magnitude bands describe statistical departure only. They do not classify event severity, sensor health or operational risk.
              </div>
            </article>

            <article className="anomaly-card anomaly-limit-card"><span>INTERPRETATION</span>
              <h3>Diagnostic flag, not event claim</h3><p>{payload.interpretation}</p>
              <small>{payload.provenance.product} · {payload.provenance.argo_provider}</small></article>
          </section>
        </div>
      )}
    </main>
  );
}
