import { useEffect } from "react";
import { ScienceSystemDirectoryNav, scienceHomeFromHash } from "../components/ScienceSystemDirectoryNav";
import type { MainBlockProvenanceEvidence } from "../main-block-provenance";
import type { Catalog, ProvenanceResponse } from "../types";

interface Props {
  catalog: Catalog;
  provenance: ProvenanceResponse | null;
  blockEvidence: MainBlockProvenanceEvidence | null;
  degradedWarnings: string[];
}

function Icon({ name }: { name: "problem" | "globe" | "column" | "evidence" | "screen" | "shield" | "pipeline" }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": true } as const;
  if (name === "problem") return <svg {...common}><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v4.8M12 17h.01" /></svg>;
  if (name === "globe") return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M3.8 12h16.4M12 3.5c2.3 2.2 3.6 5 3.6 8.5S14.3 18.3 12 20.5M12 3.5c-2.3 2.2-3.6 5-3.6 8.5s1.3 6.3 3.6 8.5" /></svg>;
  if (name === "column") return <svg {...common}><path d="M5 5.5 12 3l7 2.5-7 2.5-7-2.5Z" /><path d="M5 5.5v13L12 21l7-2.5v-13M12 8v13M5 12.1l7 2.5 7-2.5" /></svg>;
  if (name === "evidence") return <svg {...common}><path d="M4 19V7m0 12h16" /><path d="m6.5 15 3.2-4 3.1 2.3 4.7-6" /><circle cx="17.5" cy="7.3" r="1.2" /></svg>;
  if (name === "screen") return <svg {...common}><path d="M4 5h16v11H4zM8 20h8M12 16v4" /><path d="m8 12 2.3-3 2.4 2 3.3-4" /></svg>;
  if (name === "shield") return <svg {...common}><path d="M12 3 19 6v5.2c0 4.5-2.9 7.9-7 9.8-4.1-1.9-7-5.3-7-9.8V6l7-3Z" /><path d="m8.7 12 2.1 2.1 4.6-5" /></svg>;
  return <svg {...common}><path d="M4 6h5v4H4zM15 4h5v4h-5zM15 16h5v4h-5zM4 16h5v4H4z" /><path d="M9 8h3v10h3M12 8l3-2M12 18l3 0" /></svg>;
}

export function InfoPage({ catalog, provenance, blockEvidence, degradedWarnings }: Props) {
  useEffect(() => {
    const revealDeepLink = () => {
      const home = scienceHomeFromHash(window.location.hash);
      if (!home) return;
      requestAnimationFrame(() => document.getElementById(`science-${home}`)?.scrollIntoView({ block: "start", behavior: "auto" }));
    };
    revealDeepLink();
    window.addEventListener("hashchange", revealDeepLink);
    return () => window.removeEventListener("hashchange", revealDeepLink);
  }, []);
  const lon = catalog.coordinates.longitude;
  const lat = catalog.coordinates.latitude;
  const depths = catalog.coordinates.depth;
  const timestamps = catalog.coordinates.time;
  const modelDoi = provenance?.model.doi ?? catalog.dataset.doi;
  const argoDoi = provenance?.observations.doi ?? "Source DOI unavailable";
  const matchedProfiles = provenance?.quality_control.matched_profiles ?? 0;

  return (
    <main className="info-page" data-page="about" data-info-status="implemented">
      <ScienceSystemDirectoryNav />
      <section className="info-hero" id="science-overview" data-science-home="overview">
        <div>
          <div className="section-kicker">SIH26067 · SCIENCE & SYSTEM</div>
          <h2>From ocean data to an explainable 3D digital-twin workspace.</h2>
          <p>
            Ocean Canvas combines a verified GLORYS–Argo comparison baseline with genuine INCOIS
            multi-time fields, INCOIS satellite chlorophyll, and sourced Glider/CTD/BGC observations
            in an interactive browser-native ocean workspace. The goal is not to decorate a globe:
            it is to make depth-dependent structure, horizontal currents, model–observation differences,
            biogeochemical evidence and provenance inspectable without inventing missing evidence.
          </p>
        </div>
        <aside className="info-mission-card">
          <span>CORE QUESTION</span>
          <strong>What is happening in this ocean water column, at what depth, and how well does the model agree with observations?</strong>
          <small>Every view is tied back to the same canonical evidence bundle.</small>
        </aside>
      </section>

      <section className="info-problem-grid">
        <article className="info-problem-card">
          <span className="info-icon"><Icon name="problem" /></span>
          <div>
            <small>THE PROBLEM</small>
            <h3>Ocean data is multidimensional and difficult to inspect quickly.</h3>
            <p>
              Longitude, latitude, depth, time, model variables and in-situ observations arrive in
              different structures. Flat maps can hide vertical behaviour; isolated profiles can
              lose geographic context; raw files are difficult to communicate during operational
              analysis or evaluation.
            </p>
          </div>
        </article>
        <article className="info-problem-card">
          <span className="info-icon"><Icon name="pipeline" /></span>
          <div>
            <small>OUR RESPONSE</small>
            <h3>One traceable evidence pipeline, several coordinated views.</h3>
            <p>
              Ocean Canvas keeps the scientific values canonical, then exposes them through 3D,
              telemetry, comparison and diagnostic-screening views. Presentation controls such as
              vertical exaggeration or imagery never alter the underlying measurements.
            </p>
          </div>
        </article>
      </section>

      <section className="info-evidence-ladder" id="science-scientific-context" data-science-home="scientific-context" aria-label="Ocean Canvas evidence ladder">
        <article>
          <span>01</span>
          <div><small>MODEL</small><strong>Numerical ocean state</strong><p>GLORYS temperature, salinity and horizontal currents across verified model depths.</p></div>
        </article>
        <i aria-hidden="true">→</i>
        <article>
          <span>02</span>
          <div><small>TIME</small><strong>Operational breadth</strong><p>Genuine INCOIS timestamps add temporal exploration without duplicating the static GLORYS baseline.</p></div>
        </article>
        <i aria-hidden="true">→</i>
        <article>
          <span>03</span>
          <div><small>OBSERVATION</small><strong>Measured ocean profiles</strong><p>Argo, Glider, CTD and BGC evidence places real in-situ measurements into the same geospatial workspace.</p></div>
        </article>
        <i aria-hidden="true">→</i>
        <article>
          <span>04</span>
          <div><small>EXPLAIN</small><strong>Defensible 3D decisions</strong><p>Depth, provenance, residuals, QC and display-only controls remain visible instead of becoming black-box graphics.</p></div>
        </article>
      </section>

      <section className="info-evidence-grid" id="science-data-provenance" data-science-home="data-provenance">
        <div className="science-home-heading">
          <span>DATA PROVENANCE</span>
          <h3>Trace the verified reference and selected block separately.</h3>
          <p>The GLORYS–Argo cards describe the verified comparison reference. Only the active-block manifest and evidence classification below may authorize claims about another selected block.</p>
        </div>
        <article className="info-evidence-card">
          <div>
            <span>VERIFIED REFERENCE MODEL</span>
            <strong>{catalog.dataset.label}</strong>
          </div>
          <dl>
            <div><dt>Product</dt><dd>{catalog.dataset.product}</dd></div>
            <div><dt>Dataset ID</dt><dd>{catalog.dataset.dataset_id}</dd></div>
            <div><dt>Window</dt><dd>{lon[0].toFixed(2)}–{lon.at(-1)?.toFixed(2)}°E · {lat[0].toFixed(2)}–{lat.at(-1)?.toFixed(2)}°N</dd></div>
            <div><dt>Depth</dt><dd>{depths[0].toFixed(2)}–{depths.at(-1)?.toFixed(2)} m · positive down</dd></div>
            <div><dt>Genuine time steps</dt><dd>{timestamps.length}</dd></div>
            <div><dt>DOI</dt><dd>{modelDoi}</dd></div>
          </dl>
        </article>

        <article className="info-evidence-card">
          <div>
            <span>OBSERVATION EVIDENCE</span>
            <strong>{provenance?.observations.provider ?? "Argo"}</strong>
          </div>
          <dl>
            <div><dt>Matched profiles</dt><dd>{provenance ? matchedProfiles : "Metadata unavailable"}</dd></div>
            <div><dt>Provider QC</dt><dd>{provenance?.quality_control.accepted_provider_qc?.join(", ") || "Unavailable in current runtime"}</dd></div>
            <div><dt>No extrapolation</dt><dd>{provenance?.quality_control.no_extrapolation === true ? "Yes" : "Recorded in evidence contract"}</dd></div>
            <div><dt>DOI</dt><dd>{argoDoi}</dd></div>
          </dl>
        </article>
        <article className="science-detail-card" data-testid="science-active-block-provenance"
          data-block-id={blockEvidence?.blockId ?? "unavailable"}
          data-evidence-availability={blockEvidence?.evidenceAvailability ?? "unavailable"}
          data-evidence-class={blockEvidence?.evidenceClass ?? "unavailable"}>
          <h4>Selected main block</h4>
          {blockEvidence ? (
            <>
              <strong>{blockEvidence.blockId} · {blockEvidence.materialization} · {blockEvidence.evidenceClass}</strong>
              <p>{blockEvidence.summary}</p>
              <dl>
                <dt>Active evidence status</dt><dd>{blockEvidence.evidenceAvailability}</dd>
                <dt>Model payload</dt><dd>{blockEvidence.modelEvidenceAvailable ? "Attached" : "Withheld"}</dd>
                <dt>Source product</dt><dd>{blockEvidence.modelEvidenceAvailable ? (blockEvidence.sourceProduct ?? "Not specified") : "Withheld"}</dd>
                <dt>Dataset ID</dt><dd>{blockEvidence.modelEvidenceAvailable ? (blockEvidence.datasetId ?? "Not specified") : "Withheld"}</dd>
                <dt>Observation role</dt><dd>{blockEvidence.observationEvidence.evidenceClass}</dd>
                <dt>Validated comparison</dt><dd>{blockEvidence.observationEvidence.modelObservationValidated ? "Attached" : "Not attached"}</dd>
              </dl>
              {blockEvidence.withheldClaims.length > 0 && (
                <p className="science-truth-note">Withheld: {blockEvidence.withheldClaims.join(" ")}</p>
              )}
            </>
          ) : <p>Active-block scientific provenance is unavailable; no active model source claim is made.</p>}
        </article>
      </section>

      <section className="science-evidence-detail" id="science-quality-control" data-science-home="quality-control">
        <div className="science-home-heading">
          <span>QUALITY CONTROL</span>
          <h3>Provider screening and matched-level comparison</h3>
          <p>Source-reported QC gates and method descriptions are displayed without adding new validity claims.</p>
        </div>
        {provenance ? (
          <div className="science-detail-grid">
            <article className="science-detail-card" data-testid="science-quality-control">
              <h4>Observation matching gates</h4>
              <dl>
                <dt>Matched profiles</dt><dd>{provenance.quality_control.matched_profiles}</dd>
                <dt>Accepted provider QC flags</dt><dd>{provenance.quality_control.accepted_provider_qc.join(", ") || "Not specified"}</dd>
                <dt>Maximum cell distance</dt><dd>{provenance.quality_control.max_cell_distance_km === null ? "Not specified" : `${provenance.quality_control.max_cell_distance_km} km`}</dd>
                <dt>Vertical extrapolation</dt><dd>{provenance.quality_control.no_extrapolation ? "Disabled" : "Not excluded by metadata"}</dd>
                <dt>Metrics weighting</dt><dd>{provenance.quality_control.metrics_weighting ?? "Not specified"}</dd>
              </dl>
            </article>
            <article className="science-detail-card">
              <h4>Comparison methodology</h4>
              <p><strong>Horizontal:</strong> {provenance.methodology.horizontal ?? "Not available"}</p>
              <p><strong>Depth:</strong> {provenance.methodology.depth ?? "Not available"}</p>
              <p className="science-truth-note">Comparison values remain diagnostic. Model − observation is the signed residual; this is not an assertion of independent global model validation.</p>
            </article>
          </div>
        ) : <p className="science-truth-note" data-testid="science-qc-unavailable">Runtime QC metadata is unavailable. No QC gates or matched-profile counts are asserted for this session.</p>}
      </section>

      <section className="info-integrity" id="science-source-integrity" data-science-home="source-integrity">
        <div>
          <span className="info-icon"><Icon name="shield" /></span>
          <div>
            <small>SCIENTIFIC INTEGRITY CONTRACT</small>
            <h3>What Ocean Canvas deliberately refuses to fake</h3>
          </div>
        </div>
        <div className="info-integrity-grid">
          <article><strong>No synthetic timestamps</strong><p>The GLORYS comparison baseline remains limited to its {timestamps.length} genuine bundled timestamp{timestamps.length === 1 ? "" : "s"}; separate INCOIS sources provide genuine multi-time playback instead of duplicated fields.</p></article>
          <article><strong>No depth sign ambiguity</strong><p>Scientific depth is metres positive downward. Visual exaggeration changes screen geometry only.</p></article>
          <article><strong>No black-box anomaly claim</strong><p>Flags are statistical extremes using an explicit robust rule; they do not prove an ocean event, sensor fault or forecast failure.</p></article>
          <article><strong>No hidden validation claim</strong><p>Argo comparisons are diagnostic collocations for this evidence window, not a global or independent validation of the model.</p></article>
        </div>
        <div className="science-detail-grid">
          <article className="science-detail-card" data-testid="science-integrity-contract">
            <h4>Verified reference checks</h4>
            <dl>
              <dt>Reference checksum status</dt><dd>{provenance?.integrity.source_checksums_unchanged === true ? "Reported unchanged" : "Not verified in current runtime"}</dd>
              <dt>Non-synthetic output guarantee</dt><dd>{provenance?.integrity.no_synthetic_measurements_in_outputs === true ? "Declared by source contract" : "Not verified in current runtime"}</dd>
              <dt>Configuration SHA-256</dt><dd><code>{provenance?.integrity.configuration_sha256 ?? "Unavailable"}</code></dd>
              <dt>Engine SHA-256</dt><dd><code>{provenance?.integrity.engine_sha256 ?? "Unavailable"}</code></dd>
            </dl>
          </article>
          <article className="science-detail-card" data-testid="science-block-integrity">
            <h4>Selected-block integrity gates</h4>
            <dl>
              <dt>Materialized evidence</dt><dd>{blockEvidence?.evidenceAvailability ?? "Unavailable"}</dd>
              <dt>Source integrity</dt><dd>{blockEvidence?.sourceIntegrityValidated ? "Validated" : "Not claimed"}</dd>
              <dt>Renderer acceptance</dt><dd>{blockEvidence?.rendererAcceptanceValidated ? "Validated" : "Not claimed"}</dd>
              <dt>Manifest checksum evidence</dt><dd>{blockEvidence?.checksumEvidenceAvailable ? `${blockEvidence.payloadChecksums.length} canonical SHA-256 record(s)` : "Not attached"}</dd>
            </dl>
            {blockEvidence?.checksumEvidenceAvailable && (
              <ul data-testid="science-checksum-records">
                {blockEvidence.payloadChecksums.map((item) => (
                  <li key={item.date + item.path}><strong>{item.date}</strong> · <code>{item.sha256}</code></li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>

      <section className="info-section-heading" id="science-architecture" data-science-home="architecture">
        <div>
          <span>END-TO-END ARCHITECTURE</span>
          <h3>Evidence moves forward; provenance stays attached.</h3>
        </div>
      </section>

      <section className="info-pipeline" aria-label="Ocean Canvas system pipeline">
        <article>
          <span>01</span>
          <strong>Verified sources</strong>
          <p>Copernicus Marine GLORYS12V1 + Argo, build-verified INCOIS physical/chlorophyll sources, and genuine Glider/CTD/BGC observation packs.</p>
        </article>
        <i>→</i>
        <article>
          <span>02</span>
          <strong>Scientific core</strong>
          <p>Python/FastAPI contracts expose fields, scalar/current volumes, telemetry, comparisons, anomalies, provenance and OGC WMS/WCS interoperability.</p>
        </article>
        <i>→</i>
        <article>
          <span>03</span>
          <strong>Static fail-safe</strong>
          <p>Canonical API outputs and build-verified external evidence are exported as static artifacts; OPeNDAP endpoint checks fail closed before deployment.</p>
        </article>
        <i>→</i>
        <article>
          <span>04</span>
          <strong>Interactive React UI</strong>
          <p>React + Cesium present the same evidence across 3D, genuine time playback, multi-sensor inspection, comparison, screening and ingestion workspaces.</p>
        </article>
      </section>

      <section className="science-evidence-detail" id="science-system-health" data-science-home="system-health" data-health-state={degradedWarnings.length ? "degraded" : "no-reported-warnings"}>
        <div className="science-home-heading">
          <span>SYSTEM HEALTH</span>
          <h3>Runtime evidence availability</h3>
          <p>These are application-load observations, not an assertion that upstream providers are live or healthy.</p>
        </div>
        <div className="science-detail-grid">
          <article className="science-detail-card" data-testid="science-health-warnings">
            <h4>{degradedWarnings.length ? "Reported degraded conditions" : "No reported load warnings"}</h4>
            {degradedWarnings.length ? (
              <ul>{degradedWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            ) : (
              <p className="science-truth-note">The app has not recorded a degraded-source warning this session. This does not prove that remote providers are online.</p>
            )}
          </article>
          <article className="science-detail-card">
            <h4>Science evidence state</h4>
            <dl>
              <dt>Reference runtime</dt><dd>{catalog.dataset.runtime_mode}</dd>
              <dt>Reference freshness</dt><dd>{catalog.dataset.freshness_class}</dd>
              <dt>Reference timestamps</dt><dd>{timestamps.length} genuine</dd>
              <dt>Provenance metadata</dt><dd>{provenance ? "Available" : "Unavailable"}</dd>
              <dt>Active block evidence</dt><dd>{blockEvidence?.evidenceAvailability ?? "Unavailable"}</dd>
            </dl>
            {blockEvidence?.evidenceAvailability === "withheld" && (
              <p className="science-truth-note science-health-degraded">Selected block has no eligible materialized scientific payload. Verified reference fallback is not selected-block evidence.</p>
            )}
          </article>
        </div>
      </section>

      <section className="info-section-heading" id="science-capabilities" data-science-home="capabilities">
        <div>
          <span>SYSTEM CAPABILITIES</span>
          <h3>What the final MVP actually does</h3>
        </div>
        <p>Capabilities below are implemented against the verified bundled evidence, not future promises.</p>
      </section>

      <section className="info-capability-grid">
        <article>
          <span className="info-icon"><Icon name="globe" /></span>
          <strong>Cesium Globe</strong>
          <p>Geospatial context for temperature, salinity, depth-resolved horizontal currents, Argo and imported sensor profiles, plus surface INCOIS chlorophyll.</p>
          <em>MODE 1 · ONLINE HD + OFFLINE FALLBACK</em>
        </article>
        <article>
          <span className="info-icon"><Icon name="column" /></span>
          <strong>Water-Column 3D</strong>
          <p>Actual lon/lat/depth/value points, scalar isosurfaces, and genuine horizontal u/v vectors across the water column; no vertical current is invented.</p>
          <em>MODE 2 · SCIENTIFIC 3D · DEPTH-PRESERVING</em>
        </article>
        <article>
          <span className="info-icon"><Icon name="screen" /></span>
          <strong>Depth, time & telemetry</strong>
          <p>Depth slices, full-column statistics, genuine INCOIS multi-time playback, selected-depth distributions and current summaries.</p>
          <em>{depths.length} GLORYS DEPTH LEVELS + GENUINE INCOIS TIME</em>
        </article>
        <article>
          <span className="info-icon"><Icon name="evidence" /></span>
          <strong>Model vs Observation</strong>
          <p>Matched Argo temperature profiles versus vertically interpolated GLORYS12V1 values, including residuals and metrics.</p>
          <em>{matchedProfiles || "VERIFIED"} MATCHED PROFILE{matchedProfiles === 1 ? "" : "S"}</em>
        </article>
        <article>
          <span className="info-icon"><Icon name="problem" /></span>
          <strong>Anomaly screening</strong>
          <p>Explainable robust statistical screening of exact-depth model cells and Argo model-minus-observation residuals.</p>
          <em>DIAGNOSTIC · NOT EVENT DETECTION</em>
        </article>
        <article>
          <span className="info-icon"><Icon name="shield" /></span>
          <strong>Guarded Data Lab</strong>
          <p>Browser NetCDF/CF inspection plus CSV, TSV/ASCII and JSON validation; accepted observation profiles can become temporary 3D Explorer layers.</p>
          <em>FAIL-CLOSED INGESTION · LOCAL FILE BYTES</em>
        </article>
        <article>
          <span className="info-icon"><Icon name="evidence" /></span>
          <strong>Multi-sensor overlays</strong>
          <p>Genuine Glider, standalone CTD and BGC profile evidence uses one canonical plugin path with clickable geospatial markers and depth profiles.</p>
          <em>ARGO · GLIDER · CTD · BGC</em>
        </article>
        <article>
          <span className="info-icon"><Icon name="pipeline" /></span>
          <strong>Open interoperability</strong>
          <p>Discoverable adapters expose REST, verified INCOIS OPeNDAP DAP2, WMS pathways and Ocean Canvas WMS/WCS compatibility services with CF-style metadata.</p>
          <em>REST · OPeNDAP · WMS · WCS · CF</em>
        </article>
      </section>

      <section className="info-limit-note" id="science-limitations" data-science-home="limitations">
        <div className="science-home-heading"><span>LIMITATIONS</span><h3>Current evidence boundary</h3></div><strong>Source-defined scientific disclaimer</strong>
        <p>{catalog.scientific_disclaimer}</p>
      </section>
      <section className="info-judge-flow" id="science-demo-guide" data-science-home="demo-guide">
        <div>
          <span>RECOMMENDED DEMO FLOW</span>
          <h3>Show the science in five moves.</h3>
        </div>
        <ol>
          <li><strong>Explore</strong><span>Switch GLORYS ↔ INCOIS multi-time ↔ INCOIS chlorophyll; then move Geographic View ↔ Water Column 3D where the source genuinely has depth.</span></li>
          <li><strong>3D evidence</strong><span>Show scalar isosurfaces or the full-depth horizontal-current volume, then inspect genuine Glider/CTD/BGC profiles.</span></li>
          <li><strong>Compare</strong><span>Open an Argo profile and explain model − observation residuals and collocation metrics.</span></li>
          <li><strong>Screen</strong><span>Use explainable anomaly flags and point out that temporal screening is guarded by evidence availability.</span></li>
          <li><strong>Verify</strong><span>Open provenance/Data Lab to show NetCDF ingestion, plugin/source registry, OPeNDAP/WMS/WCS evidence and the offline/static fail-safe.</span></li>
        </ol>
      </section>

    </main>
  );
}
