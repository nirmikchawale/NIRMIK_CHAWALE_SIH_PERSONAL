import { useEffect, useMemo, useState } from "react";

import { ComparisonDirectoryNav } from "../components/ComparisonDirectoryNav";
import { CURRENT_VERIFIED_BASELINE } from "../main-block-engine";
import {
  isPhase35bPilotId,
  publishActiveMainBlockId,
  readActiveMainBlockId,
  subscribeActiveMainBlock
} from "../main-block-runtime";

import type {
  ComparisonLevel,
  ProfileDetail,
  ProfileSummary,
  ProvenanceResponse
} from "../types";

interface Props {
  profiles: ProfileSummary[];
  selectedProfileId: string;
  detail: ProfileDetail | null;
  loading: boolean;
  provenance: ProvenanceResponse | null;
  onProfileChange: (profileId: string) => void;
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadComparisonCsv(detail: ProfileDetail, provenance: ProvenanceResponse) {
  const summary = detail.summary;
  const header = [
    "profile_id",
    "platform_id",
    "cycle",
    "direction",
    "observation_time_utc",
    "model_dataset_id",
    "model_doi",
    "argo_doi",
    "observation_depth_m",
    "observed_temperature_c",
    "model_temperature_interpolated_c",
    "signed_bias_model_minus_observation_c",
    "absolute_error_c"
  ];
  const rows = detail.levels.map((level) => [
    summary.profile_id,
    summary.platform_id,
    summary.cycle,
    summary.direction,
    summary.observation_time_utc,
    provenance.model.dataset_id,
    provenance.model.doi,
    provenance.observations.doi,
    level.observation_depth_m,
    level.observed_temperature,
    level.model_temperature_interpolated,
    level.signed_bias_celsius,
    level.absolute_error_celsius
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  downloadTextFile(
    `OceanCanvas_Argo_${summary.platform_id}_cycle_${summary.cycle}_comparison.csv`,
    csv,
    "text/csv;charset=utf-8"
  );
}

function downloadEvidenceJson(detail: ProfileDetail, provenance: ProvenanceResponse) {
  const summary = detail.summary;
  downloadTextFile(
    `OceanCanvas_Argo_${summary.platform_id}_cycle_${summary.cycle}_evidence.json`,
    JSON.stringify(
      {
        exported_by: "Ocean Canvas · SIH26067",
        evidence_type: "diagnostic model-observation consistency",
        comparison: detail,
        provenance
      },
      null,
      2
    ),
    "application/json;charset=utf-8"
  );
}

function linePoints(
  levels: ComparisonLevel[],
  accessor: (level: ComparisonLevel) => number,
  width: number,
  height: number,
  xMin: number,
  xMax: number,
  maxDepth: number
) {
  return levels
    .map((level) => {
      const x = 22 + ((accessor(level) - xMin) / Math.max(xMax - xMin, 1e-9)) * (width - 44);
      const y = 18 + (level.observation_depth_m / Math.max(maxDepth, 1e-9)) * (height - 36);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function quantile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function comparisonDiagnostics(levels: ComparisonLevel[]) {
  const biases = levels.map((level) => level.signed_bias_celsius);
  const absoluteErrors = levels.map((level) => level.absolute_error_celsius);
  const meanBias = biases.reduce((sum, value) => sum + value, 0) / Math.max(biases.length, 1);
  const medianAbsoluteError = quantile(absoluteErrors, 0.5);
  const p90AbsoluteError = quantile(absoluteErrors, 0.9);
  const maxLevel = levels.reduce(
    (current, level) =>
      level.absolute_error_celsius > current.absolute_error_celsius ? level : current,
    levels[0]
  );
  return {
    meanBias,
    medianAbsoluteError,
    p90AbsoluteError,
    maxLevel,
    maxAbsBias: Math.max(0.05, ...biases.map((value) => Math.abs(value))),
    warmerCount: biases.filter((value) => value > 0).length,
    coolerCount: biases.filter((value) => value < 0).length,
    equalCount: biases.filter((value) => value === 0).length
  };
}

function ComparisonCollocationMiniMap({ summary }: { summary: ProfileSummary }) {
  const obsLon = summary.observation_longitude;
  const obsLat = summary.observation_latitude;
  const modelLon = summary.model_cell_longitude;
  const modelLat = summary.model_cell_latitude;
  const lonPad = Math.max(Math.abs(obsLon - modelLon) * 2.5, 0.035);
  const latPad = Math.max(Math.abs(obsLat - modelLat) * 2.5, 0.035);
  const lonMid = (obsLon + modelLon) / 2;
  const latMid = (obsLat + modelLat) / 2;
  const lonMin = lonMid - lonPad;
  const lonMax = lonMid + lonPad;
  const latMin = latMid - latPad;
  const latMax = latMid + latPad;
  const x = (lon: number) => 26 + ((lon - lonMin) / Math.max(lonMax - lonMin, 1e-9)) * 308;
  const y = (lat: number) => 174 - ((lat - latMin) / Math.max(latMax - latMin, 1e-9)) * 138;

  return (
    <div className="comparison-collocation-map">
      <svg viewBox="0 0 360 200" role="img" aria-label="Argo observation to nearest Copernicus model-cell collocation">
        <line x1="26" x2="334" y1="52" y2="52" className="collocation-grid-line" />
        <line x1="26" x2="334" y1="105" y2="105" className="collocation-grid-line" />
        <line x1="26" x2="334" y1="158" y2="158" className="collocation-grid-line" />
        <line x1="92" x2="92" y1="26" y2="174" className="collocation-grid-line" />
        <line x1="180" x2="180" y1="26" y2="174" className="collocation-grid-line" />
        <line x1="268" x2="268" y1="26" y2="174" className="collocation-grid-line" />
        <line
          x1={x(obsLon)}
          y1={y(obsLat)}
          x2={x(modelLon)}
          y2={y(modelLat)}
          className="collocation-link"
        />
        <circle cx={x(modelLon)} cy={y(modelLat)} r="7" className="collocation-model-point" />
        <circle cx={x(obsLon)} cy={y(obsLat)} r="7" className="collocation-argo-point" />
        <text x={x(obsLon) + 10} y={y(obsLat) - 8} className="collocation-argo-label">Argo</text>
        <text x={x(modelLon) + 10} y={y(modelLat) + 17} className="collocation-model-label">Model cell</text>
      </svg>
      <div className="comparison-collocation-legend">
        <span><i className="legend-dot observation-dot" /> Argo observation</span>
        <span><i className="legend-dot model-dot" /> nearest valid model water cell</span>
        <strong>{summary.spatial_distance_km.toFixed(3)} km separation</strong>
      </div>
    </div>
  );
}

function ComparisonProfileChart({ detail }: { detail: ProfileDetail }) {
  const width = 560;
  const height = 360;
  const temperatures = detail.levels.flatMap((level) => [
    level.observed_temperature,
    level.model_temperature_interpolated
  ]);
  const xMin = Math.min(...temperatures);
  const xMax = Math.max(...temperatures);
  const maxDepth = Math.max(...detail.levels.map((level) => level.observation_depth_m));

  const observed = linePoints(
    detail.levels,
    (level) => level.observed_temperature,
    width,
    height,
    xMin,
    xMax,
    maxDepth
  );
  const model = linePoints(
    detail.levels,
    (level) => level.model_temperature_interpolated,
    width,
    height,
    xMin,
    xMax,
    maxDepth
  );

  return (
    <section className="comparison-chart-card comparison-profile-card">
      <div className="comparison-card-heading">
        <div>
          <span>PROFILE EVIDENCE</span>
          <h3>Observed vs interpolated model temperature</h3>
        </div>
        <strong>{xMin.toFixed(2)}–{xMax.toFixed(2)} °C</strong>
      </div>
      <svg
        className="comparison-profile-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Argo observed and Copernicus model temperature profiles by depth"
      >
        <line x1="22" x2={width - 22} y1="18" y2="18" className="grid-line" />
        <line x1="22" x2={width - 22} y1={height / 2} y2={height / 2} className="grid-line" />
        <line x1="22" x2={width - 22} y1={height - 18} y2={height - 18} className="grid-line" />
        <polyline points={model} className="profile-line model-line comparison-line" />
        <polyline points={observed} className="profile-line observation-line comparison-line" />
      </svg>
      <div className="comparison-chart-legend">
        <span><i className="legend-dot model-dot" /> Copernicus interpolated model</span>
        <span><i className="legend-dot observation-dot" /> Argo observation</span>
        <span>Depth increases downward · max {maxDepth.toFixed(0)} m</span>
      </div>
    </section>
  );
}

function ComparisonBiasChart({ detail }: { detail: ProfileDetail }) {
  const width = 560;
  const height = 300;
  const maxDepth = Math.max(...detail.levels.map((level) => level.observation_depth_m));
  const maxAbsBias = Math.max(0.05, ...detail.levels.map((level) => Math.abs(level.signed_bias_celsius)));
  const points = linePoints(
    detail.levels,
    (level) => level.signed_bias_celsius,
    width,
    height,
    -maxAbsBias,
    maxAbsBias,
    maxDepth
  );

  return (
    <section className="comparison-chart-card comparison-bias-card">
      <div className="comparison-card-heading">
        <div>
          <span>BIAS DIAGNOSTIC</span>
          <h3>Model − Observation by depth</h3>
        </div>
        <strong>±{maxAbsBias.toFixed(3)} °C</strong>
      </div>
      <svg
        className="comparison-bias-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Signed model minus observation temperature bias by depth"
      >
        <line x1={width / 2} x2={width / 2} y1="18" y2={height - 18} className="bias-zero-line" />
        <line x1="22" x2={width - 22} y1="18" y2="18" className="grid-line" />
        <line x1="22" x2={width - 22} y1={height - 18} y2={height - 18} className="grid-line" />
        <polyline points={points} className="profile-line bias-line comparison-line" />
      </svg>
      <div className="comparison-chart-legend">
        <span>Negative = model cooler</span>
        <span>Positive = model warmer</span>
        <span>Zero line = exact temperature agreement at a matched depth</span>
      </div>
    </section>
  );
}

export function ComparisonPage({
  profiles,
  selectedProfileId,
  detail,
  loading,
  provenance,
  onProfileChange
}: Props) {
  const [activeBlockId, setActiveBlockId] = useState(readActiveMainBlockId);
  const pilotComparisonUnavailable = isPhase35bPilotId(activeBlockId);
  const summary = detail?.summary;
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);

  useEffect(() => subscribeActiveMainBlock(setActiveBlockId), []);

  useEffect(() => {
    setSelectedLevelIndex(0);
  }, [summary?.profile_id]);

  const diagnostics = useMemo(
    () => detail && detail.levels.length > 0 ? comparisonDiagnostics(detail.levels) : null,
    [detail]
  );
  const selectedLevel = detail?.levels[
    Math.min(selectedLevelIndex, Math.max((detail?.levels.length ?? 1) - 1, 0))
  ] ?? null;

  return (
    <main className="comparison-page" data-page="compare">
      <ComparisonDirectoryNav />

      <section id="comparison-overview" className="comparison-directory-section comparison-overview-home" data-comparison-home="overview">
        <header className="comparison-hero">
          <div>
            <span className="section-kicker">EVIDENCE · MODEL VS OBSERVATION</span>
            <h2>Argo–GLORYS12V1 profile comparison</h2>
            <p>
              Matched-depth diagnostic evidence using the existing verified collocation pipeline.
              Model values are interpolated to observation depths; this page does not create new
              measurements, timestamps or independent validation claims.
            </p>
          </div>
          <div className="comparison-overview-guardrail">
            <span>INTERPRETATION BOUNDARY</span>
            <strong>Diagnostic consistency, not independent validation</strong>
            <small>MAE, RMSE and signed bias describe the selected verified collocated sample only.</small>
          </div>
        </header>
      </section>

      <section id="comparison-observation-sources" className="comparison-directory-section" data-comparison-home="observation-sources">
        <header className="comparison-directory-heading">
          <div>
            <span>OBSERVATION SOURCES</span>
            <h3>Select verified Argo evidence</h3>
          </div>
          <small>{pilotComparisonUnavailable ? "Comparison availability depends on the selected scientific block" : "Provider-QC accepted source profiles only"}</small>
        </header>
        <div className="comparison-source-grid">
          <div className="comparison-selector-card">
            <label>
              Verified Argo profile
              <select
                value={pilotComparisonUnavailable ? "" : selectedProfileId}
                disabled={pilotComparisonUnavailable || profiles.length === 0}
                onChange={(event) => onProfileChange(event.target.value)}
              >
                {(pilotComparisonUnavailable || profiles.length === 0) && <option value="">{pilotComparisonUnavailable ? `No matched profiles for ${activeBlockId}` : "No verified profile available"}</option>}
                {!pilotComparisonUnavailable && profiles.map((profile) => (
                  <option key={profile.profile_id} value={profile.profile_id}>
                    {profile.platform_id} · cycle {profile.cycle} {profile.direction}
                  </option>
                ))}
              </select>
            </label>
            <div className="comparison-selector-meta">
              <span>{pilotComparisonUnavailable ? "Argo comparison not attached to this block" : `${profiles.length} verified comparison profile${profiles.length === 1 ? "" : "s"}`}</span>
              <strong>{pilotComparisonUnavailable ? activeBlockId : summary ? `Argo ${summary.platform_id} · cycle ${summary.cycle}` : "Awaiting profile"}</strong>
            </div>
          </div>
          <article className="comparison-source-summary">
            <div>
              <span>MODEL SOURCE</span>
              <strong>{provenance?.model.product ?? "Copernicus GLORYS12V1"}</strong>
              <small>{provenance?.model.dataset_id ?? "Verified cached reanalysis"}</small>
            </div>
            <div>
              <span>OBSERVATION SOURCE</span>
              <strong>{provenance?.observations.provider ?? "Ifremer Argo GDAC"}</strong>
              <small>{pilotComparisonUnavailable ? "Reference provider only · no matched profiles attached to this block" : provenance?.observations.doi ?? "Verified comparison evidence"}</small>
            </div>
          </article>
        </div>
      </section>

      {pilotComparisonUnavailable ? (
        <section className="comparison-state-card comparison-unavailable" aria-labelledby="comparison-unavailable-heading">
          <h3 id="comparison-unavailable-heading">No Argo comparisons are attached to {activeBlockId}</h3>
          <p>
            This pilot block has source-backed model data, but no matched Argo comparison bundle.
            Profiles and metrics from the verified reference baseline cannot be used to validate this block.
          </p>
          <p>
            Switch to BASE-GLORYS-001 to view its verified Argo comparisons.
            This changes the active scientific block across the workspace.
          </p>
          <button type="button" onClick={() => publishActiveMainBlockId(CURRENT_VERIFIED_BASELINE.id)}>
            View verified baseline Argo comparisons
          </button>
        </section>
      ) : loading ? (
        <div className="comparison-state-card">Loading verified matched-depth evidence…</div>
      ) : !detail || !summary ? (
        <div className="comparison-state-card">{profiles.length === 0
          ? "Verified Argo comparison evidence is loading or unavailable. If this persists, refresh the workspace to retry."
          : "Select a verified Argo comparison profile."}</div>
      ) : (
        <>
          <section id="comparison-matchups" className="comparison-directory-section" data-comparison-home="matchups">
            <header className="comparison-directory-heading">
              <div>
                <span>MATCHUPS</span>
                <h3>Collocation context and matched-level evidence</h3>
              </div>
              <small>{detail.levels.length} QC-accepted matched levels</small>
            </header>
            <div className="comparison-matchup-grid">
              <article className="comparison-location-card">
                <div className="comparison-card-heading">
                  <div>
                    <span>COLLOCATION</span>
                    <h3>Observation and model-cell context</h3>
                  </div>
                </div>
                <ComparisonCollocationMiniMap summary={summary} />
                <dl>
                  <div>
                    <dt>Argo observation</dt>
                    <dd>{summary.observation_latitude.toFixed(4)}°N · {summary.observation_longitude.toFixed(4)}°E</dd>
                  </div>
                  <div>
                    <dt>Model cell</dt>
                    <dd>{summary.model_cell_latitude.toFixed(4)}°N · {summary.model_cell_longitude.toFixed(4)}°E</dd>
                  </div>
                  <div>
                    <dt>Observation time</dt>
                    <dd>{summary.observation_time_utc.replace("T", " ").replace("Z", " UTC")}</dd>
                  </div>
                  <div>
                    <dt>QC status</dt>
                    <dd>Accepted provider QC · no depth extrapolation</dd>
                  </div>
                </dl>
              </article>

              <section className="comparison-levels-card">
                <div className="comparison-card-heading">
                  <div>
                    <span>MATCHED LEVELS</span>
                    <h3>Depth-by-depth evidence table</h3>
                  </div>
                  <strong>{detail.levels.length} rows</strong>
                </div>
                <div className="comparison-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Depth (m)</th>
                        <th>Argo (°C)</th>
                        <th>Model (°C)</th>
                        <th>Bias M−O (°C)</th>
                        <th>|Error| (°C)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.levels.map((level) => (
                        <tr key={level.observation_depth_m}>
                          <td>{level.observation_depth_m.toFixed(2)}</td>
                          <td>{level.observed_temperature.toFixed(4)}</td>
                          <td>{level.model_temperature_interpolated.toFixed(4)}</td>
                          <td className={level.signed_bias_celsius >= 0 ? "positive-bias" : "negative-bias"}>
                            {level.signed_bias_celsius >= 0 ? "+" : ""}{level.signed_bias_celsius.toFixed(4)}
                          </td>
                          <td>{level.absolute_error_celsius.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </section>

          <section id="comparison-profile-comparison" className="comparison-directory-section" data-comparison-home="profile-comparison">
            <header className="comparison-directory-heading">
              <div>
                <span>PROFILE COMPARISON</span>
                <h3>Observed and interpolated model temperature</h3>
              </div>
              <small>Exact matched depths from the verified profile</small>
            </header>
            {selectedLevel && diagnostics && (
              <article className="comparison-depth-inspector">
                <div className="comparison-card-heading">
                  <div>
                    <span>INTERACTIVE MATCHED DEPTH</span>
                    <h3>Depth-resolved inspector</h3>
                  </div>
                  <strong>{selectedLevel.observation_depth_m.toFixed(2)} m</strong>
                </div>
                <p>
                  Move through the exact QC-accepted matched-level table used by the profile,
                  bias chart, metrics and downloads.
                </p>
                <input
                  aria-label="Matched comparison depth"
                  type="range"
                  min={0}
                  max={Math.max(0, detail.levels.length - 1)}
                  value={Math.min(selectedLevelIndex, Math.max(detail.levels.length - 1, 0))}
                  onChange={(event) => setSelectedLevelIndex(Number(event.target.value))}
                />
                <div className="comparison-depth-values">
                  <div><span>Argo observed</span><strong>{selectedLevel.observed_temperature.toFixed(4)} °C</strong></div>
                  <div><span>Model interpolated</span><strong>{selectedLevel.model_temperature_interpolated.toFixed(4)} °C</strong></div>
                  <div><span>Bias M−O</span><strong className={selectedLevel.signed_bias_celsius >= 0 ? "positive-bias" : "negative-bias"}>
                    {selectedLevel.signed_bias_celsius >= 0 ? "+" : ""}{selectedLevel.signed_bias_celsius.toFixed(4)} °C
                  </strong></div>
                  <div><span>|Error|</span><strong>{selectedLevel.absolute_error_celsius.toFixed(4)} °C</strong></div>
                </div>
                <div className="comparison-bias-meter" aria-label="Selected-depth signed bias position">
                  <span className="cooler-label">MODEL COOLER</span>
                  <i className="bias-meter-zero" />
                  <i
                    className="bias-meter-point"
                    style={{
                      left: `${50 + 50 * selectedLevel.signed_bias_celsius / diagnostics.maxAbsBias}%`
                    }}
                  />
                  <span className="warmer-label">MODEL WARMER</span>
                </div>
              </article>
            )}
            <ComparisonProfileChart detail={detail} />
          </section>

          <section id="comparison-bias-by-depth" className="comparison-directory-section" data-comparison-home="bias-by-depth">
            <header className="comparison-directory-heading">
              <div>
                <span>BIAS BY DEPTH</span>
                <h3>Model − Observation residual structure</h3>
              </div>
              <small>Signed residuals only · positive means model warmer</small>
            </header>
            <ComparisonBiasChart detail={detail} />
          </section>

          <section id="comparison-metrics" className="comparison-directory-section" data-comparison-home="metrics">
            <header className="comparison-directory-heading">
              <div>
                <span>METRICS</span>
                <h3>Profile summary and residual diagnostics</h3>
              </div>
              <small>Selected collocated sample only</small>
            </header>
            <section className="comparison-metrics" aria-label="Comparison summary metrics">
              <article>
                <span>Matched levels</span>
                <strong>{summary.matched_level_count}</strong>
                <small>provider-QC accepted matched depths</small>
              </article>
              <article>
                <span>MAE</span>
                <strong>{summary.mae_celsius.toFixed(3)} °C</strong>
                <small>mean absolute temperature error</small>
              </article>
              <article>
                <span>RMSE</span>
                <strong>{summary.rmse_celsius.toFixed(3)} °C</strong>
                <small>root mean squared temperature error</small>
              </article>
              <article>
                <span>Cell distance</span>
                <strong>{summary.spatial_distance_km.toFixed(2)} km</strong>
                <small>observation to selected model cell</small>
              </article>
              <article>
                <span>Time offset</span>
                <strong>{summary.time_offset_hours.toFixed(2)} h</strong>
                <small>observation vs cached model timestamp</small>
              </article>
              <article>
                <span>Matched depth</span>
                <strong>{summary.shallowest_matched_depth_m.toFixed(0)}–{summary.deepest_matched_depth_m.toFixed(0)} m</strong>
                <small>no extrapolation beyond matched evidence</small>
              </article>
            </section>
            {diagnostics && (
              <article className="comparison-diagnostic-summary">
                <div className="comparison-card-heading">
                  <div>
                    <span>PROFILE RESIDUAL SUMMARY</span>
                    <h3>What the matched evidence says</h3>
                  </div>
                  <strong>{detail.levels.length} levels</strong>
                </div>
                <div className="comparison-diagnostic-grid">
                  <div><span>Mean signed bias</span><strong>{diagnostics.meanBias >= 0 ? "+" : ""}{diagnostics.meanBias.toFixed(4)} °C</strong></div>
                  <div><span>Median |error|</span><strong>{diagnostics.medianAbsoluteError.toFixed(4)} °C</strong></div>
                  <div><span>P90 |error|</span><strong>{diagnostics.p90AbsoluteError.toFixed(4)} °C</strong></div>
                  <div><span>Largest |error|</span><strong>{diagnostics.maxLevel.absolute_error_celsius.toFixed(4)} °C</strong><small>at {diagnostics.maxLevel.observation_depth_m.toFixed(1)} m</small></div>
                </div>
                <div className="comparison-warm-cool-split">
                  <span>Warm / cool split</span>
                  <strong>{diagnostics.warmerCount} warmer · {diagnostics.coolerCount} cooler · {diagnostics.equalCount} exact-zero</strong>
                  <small>Counts describe signed Model − Observation residuals in this selected profile only.</small>
                </div>
              </article>
            )}
          </section>

          <section id="comparison-qc" className="comparison-directory-section" data-comparison-home="qc">
            <header className="comparison-directory-heading">
              <div>
                <span>QC</span>
                <h3>Comparison method and quality-control contract</h3>
              </div>
              <small>Provider QC · positive-down depth · no extrapolation</small>
            </header>
            <article className="comparison-method-card">
              <div className="comparison-card-heading">
                <div>
                  <span>METHOD</span>
                  <h3>How this comparison is constructed</h3>
                </div>
              </div>
              <dl>
                <div><dt>Horizontal</dt><dd>{detail.comparison_semantics.horizontal}</dd></div>
                <div><dt>Vertical</dt><dd>{detail.comparison_semantics.vertical}</dd></div>
                <div><dt>Bias</dt><dd>{detail.comparison_semantics.bias}</dd></div>
                <div><dt>Interpretation</dt><dd>{detail.comparison_semantics.interpretation}</dd></div>
              </dl>
              <div className="comparison-method-pipeline" aria-label="Comparison method pipeline">
                <span>Provider QC</span>
                <i>→</i>
                <span>Positive-down depth</span>
                <i>→</i>
                <span>Nearest valid water cell</span>
                <i>→</i>
                <span>Linear depth interpolation</span>
                <i>→</i>
                <span>No extrapolation</span>
                <i>→</i>
                <span>Bias = Model − Observation</span>
              </div>
            </article>
          </section>

          <section id="comparison-evidence" className="comparison-directory-section" data-comparison-home="evidence">
            <header className="comparison-directory-heading">
              <div>
                <span>EVIDENCE</span>
                <h3>Download the verified comparison bundle</h3>
              </div>
              <small>Profile data + provenance + interpretation boundary</small>
            </header>
            <section className="comparison-provenance-card">
              <div>
                <span>MODEL SOURCE</span>
                <strong>{provenance?.model.product ?? "Copernicus GLORYS12V1"}</strong>
                <small>{provenance?.model.dataset_id ?? "Verified cached reanalysis"}</small>
              </div>
              <div>
                <span>OBSERVATION SOURCE</span>
                <strong>{provenance?.observations.provider ?? "Ifremer Argo GDAC"}</strong>
                <small>{provenance?.observations.doi ?? "Verified comparison evidence"}</small>
              </div>
              <div className="comparison-downloads">
                <button disabled={!provenance} onClick={() => provenance && downloadComparisonCsv(detail, provenance)}>
                  Download comparison CSV
                </button>
                <button disabled={!provenance} onClick={() => provenance && downloadEvidenceJson(detail, provenance)}>
                  Download evidence JSON
                </button>
              </div>
            </section>
            <p className="comparison-diagnostic-note">
              Diagnostic model–observation consistency, not independent validation. MAE, RMSE and
              signed bias describe this verified collocated sample only; they are not a claim of
              global model accuracy.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
