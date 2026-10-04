import { useEffect, useMemo, useState } from "react";

import {
  CURRENT_VERIFIED_BASELINE,
  INDIAN_OCEAN_MAIN_BLOCKS,
  MAIN_BLOCK_ENGINE_VERSION,
  MAIN_BLOCK_REGIONS,
  TARGET_BLOCK_COUNT,
  TARGET_DOMAIN,
  blockBoundsLabel,
  intersectsBaseline,
  type MainBlockRegion,
  type OceanMainBlock
} from "../main-block-engine";
import {
  fetchPilotMainBlockManifest,
  type PilotBlockManifest,
  type PilotBlockManifestEntry
} from "../pilot-main-block-loader";

const PREVIEW_STORAGE_KEY = "oceancanvas-main-block-preview-v1";

type RegionFilter = "all" | MainBlockRegion;
type ManifestState = "loading" | "ready" | "error";

function initialPreviewId(): string {
  try {
    const stored = window.localStorage.getItem(PREVIEW_STORAGE_KEY);
    return INDIAN_OCEAN_MAIN_BLOCKS.some((block) => block.id === stored) ? stored! : "IO-001";
  } catch {
    return "IO-001";
  }
}

function formatTargetCount(value: number): string {
  return value.toLocaleString("en-IN");
}

function validateManifest(manifest: PilotBlockManifest): PilotBlockManifest {
  const valid =
    manifest.phase === "3.5B" &&
    manifest.target_domain.logical_block_count === TARGET_BLOCK_COUNT &&
    manifest.blocks.length === TARGET_BLOCK_COUNT &&
    manifest.integrity.logical_block_count === TARGET_BLOCK_COUNT &&
    manifest.integrity.pilot_block_count === 24 &&
    manifest.integrity.multi_date_pilot_count === 6 &&
    manifest.integrity.land_blocks_materialized === 0 &&
    manifest.integrity.synthetic_measurements === false &&
    manifest.integrity.synthetic_timestamps === false &&
    manifest.integrity.synthetic_coordinates === false &&
    manifest.integrity.synthetic_depths === false &&
    manifest.integrity.vertical_component_available === false;
  if (!valid) throw new Error("Phase 3.5B evidence manifest failed the expected 140 / 24 / 6 integrity contract.");
  return manifest;
}

function evidenceStatus(evidence: PilotBlockManifestEntry | undefined): string {
  if (!evidence) return "EVIDENCE STATUS UNAVAILABLE";
  if (evidence.materialization === "pilot") return "SOURCE-BACKED PILOT · RENDERER ACTIVATION PENDING 4B";
  if (evidence.ocean_relevance === "land") return "LAND-DOMINANT · NOT MATERIALIZED";
  if (evidence.ocean_relevance === "coastal") return "COASTAL TARGET · NOT MATERIALIZED";
  return "OCEAN TARGET · NOT MATERIALIZED";
}

export function Phase35MainBlockEngine() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(initialPreviewId);
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [query, setQuery] = useState("");
  const [manifest, setManifest] = useState<PilotBlockManifest | null>(null);
  const [manifestState, setManifestState] = useState<ManifestState>("loading");

  const onExploreRoute = hash === "" || hash === "#" || hash.startsWith("#/explore");
  const selected = INDIAN_OCEAN_MAIN_BLOCKS.find((block) => block.id === selectedId) ?? INDIAN_OCEAN_MAIN_BLOCKS[0];
  const evidenceById = useMemo(
    () => new Map((manifest?.blocks ?? []).map((block) => [block.id, block])),
    [manifest]
  );
  const selectedEvidence = evidenceById.get(selected.id);

  const visibleBlocks = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return INDIAN_OCEAN_MAIN_BLOCKS.filter((block) => {
      const regionMatch = regionFilter === "all" || block.region === regionFilter;
      const evidence = evidenceById.get(block.id);
      const evidenceText = evidence
        ? `${evidence.ocean_relevance} ${evidence.materialization} ${evidence.available_dates.join(" ")}`
        : "";
      const textMatch =
        !cleanQuery ||
        `${block.id} ${block.region} ${blockBoundsLabel(block)} ${evidenceText}`.toLowerCase().includes(cleanQuery);
      return regionMatch && textMatch;
    });
  }, [query, regionFilter, evidenceById]);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setManifestState("loading");
    fetchPilotMainBlockManifest()
      .then(validateManifest)
      .then((nextManifest) => {
        if (cancelled) return;
        setManifest(nextManifest);
        setManifestState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setManifest(null);
        setManifestState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!onExploreRoute) setOpen(false);
  }, [onExploreRoute]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PREVIEW_STORAGE_KEY, selectedId);
    } catch {
      // Preview selection still works for this session if storage is unavailable.
    }
  }, [selectedId]);

  if (!onExploreRoute) return null;

  const selectBlock = (block: OceanMainBlock) => {
    setSelectedId(block.id);
  };

  const pilotCount = manifest?.integrity.pilot_block_count;
  const multiDateCount = manifest?.integrity.multi_date_pilot_count;
  const landPilotCount = manifest?.integrity.land_blocks_materialized;
  const statusLabel = evidenceStatus(selectedEvidence);
  const selectedDates = selectedEvidence?.available_dates ?? [];
  const oceanPercent = selectedEvidence ? `${(selectedEvidence.ocean_fraction * 100).toFixed(1)}%` : "—";

  return (
    <div
      className="phase35-block-engine-root"
      data-phase="4a-source-aware-geography"
      data-manifest-state={manifestState}
      data-testid="phase35-main-block-engine"
    >
      {!open && (
        <button
          type="button"
          className="phase35-block-launcher"
          onClick={() => setOpen(true)}
          aria-expanded="false"
          data-testid="phase35-block-launcher"
        >
          <span className="phase35-engine-icon" aria-hidden="true">▦</span>
          <span>
            <strong>Indian Ocean Block Engine</strong>
            <small>
              {manifestState === "ready"
                ? `${pilotCount} source-backed pilots · ${TARGET_BLOCK_COUNT} logical cells`
                : manifestState === "error"
                  ? "140 logical cells · evidence manifest unavailable"
                  : "140 logical cells · loading source evidence…"}
            </small>
          </span>
        </button>
      )}

      {open && (
        <>
          <button
            type="button"
            className="phase35-block-backdrop"
            aria-label="Close Indian Ocean Main Block Engine"
            onClick={() => setOpen(false)}
          />
          <aside className="phase35-block-panel" role="dialog" aria-modal="true" aria-label="Indian Ocean Main Block Engine">
            <header className="phase35-block-header">
              <div>
                <span className="phase35-kicker">PHASE 4A · SOURCE-AWARE GEOGRAPHY · {MAIN_BLOCK_ENGINE_VERSION}</span>
                <h2>Indian Ocean Main Block Engine</h2>
                <p>
                  A source-aware index of {TARGET_BLOCK_COUNT} logical cells across {TARGET_DOMAIN.west}–{TARGET_DOMAIN.east}°E and {TARGET_DOMAIN.south}–{TARGET_DOMAIN.north}°N. Phase 3.5B evidence now distinguishes materialized GLORYS12V1 pilots, planned ocean/coastal targets and land-dominant cells without copying the current baseline.
                </p>
              </div>
              <button type="button" className="phase35-block-close" onClick={() => setOpen(false)} aria-label="Close main block engine">×</button>
            </header>

            {manifestState === "error" && (
              <div className="phase4a-manifest-alert" role="alert">
                <strong>Evidence manifest unavailable.</strong>
                <span>The planning catalog remains usable, but Ocean Canvas will not infer pilot or ocean/land status until the verified manifest loads.</span>
              </div>
            )}

            <section className="phase35-block-summary" aria-label="Block engine status">
              <article>
                <small>LOGICAL CELLS</small>
                <strong>{formatTargetCount(TARGET_BLOCK_COUNT)}</strong>
                <span>complete geographic audit grid</span>
              </article>
              <article className="materialized">
                <small>SOURCE-BACKED PILOTS</small>
                <strong>{pilotCount ?? "—"}</strong>
                <span>genuine GLORYS12V1 geographic extracts</span>
              </article>
              <article>
                <small>MULTI-DATE PILOTS</small>
                <strong>{multiDateCount ?? "—"}</strong>
                <span>two genuine historical daily fields</span>
              </article>
              <article className="verified">
                <small>LAND PILOTS / BASELINE</small>
                <strong>{landPilotCount ?? "—"} / 1</strong>
                <span>no land materialized · baseline kept separate</span>
              </article>
            </section>

            <div className="phase35-block-body">
              <section className="phase35-block-catalog" aria-label="Logical main-block catalog">
                <div className="phase35-block-toolbar">
                  <label>
                    <span>Region</span>
                    <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value as RegionFilter)}>
                      <option value="all">All regions</option>
                      {MAIN_BLOCK_REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Find block or status</span>
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="IO-001, Bay of Bengal, pilot, coastal…" />
                  </label>
                  <div className="phase35-block-result-count" aria-live="polite">
                    <strong>{visibleBlocks.length}</strong>
                    <span>shown of {TARGET_BLOCK_COUNT}</span>
                  </div>
                </div>

                <div className="phase35-grid-note">
                  <span>14 × 10 logical audit grid · land cells remain inspectable here</span>
                  <span>Pilot = source payload exists · renderer activation intentionally waits for Phase 4B</span>
                </div>

                <div className="phase35-block-grid" role="group" aria-label="140 logical Indian Ocean main blocks">
                  {visibleBlocks.map((block) => {
                    const active = block.id === selected.id;
                    const overlapsCurrent = intersectsBaseline(block);
                    const evidence = evidenceById.get(block.id);
                    const pilot = evidence?.materialization === "pilot";
                    const relevance = evidence?.ocean_relevance;
                    const materialization = evidence ? evidence.materialization : "unknown";
                    const label = evidence
                      ? pilot
                        ? `${block.id}, ${block.region}, ${blockBoundsLabel(block)}, source-backed pilot, ${evidence.available_dates.length} genuine date${evidence.available_dates.length === 1 ? "" : "s"}`
                        : `${block.id}, ${block.region}, ${blockBoundsLabel(block)}, ${relevance} target, not materialized`
                      : `${block.id}, ${block.region}, ${blockBoundsLabel(block)}, evidence status unavailable`;
                    return (
                      <button
                        key={block.id}
                        type="button"
                        className={`phase35-block-cell ${active ? "active" : ""} ${overlapsCurrent ? "baseline-overlap" : ""} ${pilot ? "pilot" : ""} ${relevance ?? "unknown"}`}
                        aria-pressed={active}
                        aria-label={label}
                        data-block-id={block.id}
                        data-materialization={materialization}
                        data-ocean-relevance={relevance ?? "unknown"}
                        onClick={() => selectBlock(block)}
                      >
                        <strong>{block.id.replace("IO-", "")}</strong>
                        <span>{pilot ? "PILOT" : relevance === "land" ? "LAND" : relevance === "coastal" ? "COAST" : `${block.west}–${block.east}E`}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <aside className="phase35-block-inspector" aria-label="Selected block details">
                <div className={`phase35-inspector-status ${selectedEvidence?.materialization === "pilot" ? "pilot" : selectedEvidence?.ocean_relevance ?? "unknown"}`}>
                  <span>{statusLabel}</span>
                  <strong>{selected.id}</strong>
                </div>
                <h3>{selected.region}</h3>
                <p className="phase35-selected-bounds">{blockBoundsLabel(selected)}</p>

                <dl className="phase35-block-facts">
                  <div><dt>Ocean relevance</dt><dd>{selectedEvidence ? `${selectedEvidence.ocean_relevance} · ${oceanPercent} finite surface-water coverage` : "Unavailable until evidence manifest loads"}</dd></div>
                  <div><dt>Materialization</dt><dd>{selectedEvidence?.materialization === "pilot" ? "Genuine browser-ready GLORYS12V1 payload available" : selectedEvidence ? "No scientific field payload for this logical target" : "Unknown — no status inferred"}</dd></div>
                  <div><dt>Available dates</dt><dd>{selectedDates.length ? selectedDates.join(" · ") : "None materialized"}</dd></div>
                  <div><dt>Variables</dt><dd>{selectedEvidence?.materialization === "pilot" ? "thetao · so · uo · vo (horizontal current only)" : "Temperature · Salinity · Currents planned by schema"}</dd></div>
                  <div><dt>Source</dt><dd>{selectedEvidence?.materialization === "pilot" ? "Copernicus Marine / Mercator Ocean GLORYS12V1" : "GLORYS12V1 target architecture"}</dd></div>
                  <div><dt>Archive transport</dt><dd>{selectedEvidence?.materialization === "pilot" ? manifest?.source.archive_provider ?? "Recorded in manifest" : "—"}</dd></div>
                  <div><dt>Water Column 3D</dt><dd>{selectedEvidence?.materialization === "pilot" ? "Source evidence ready; active renderer wiring is deliberately deferred to Phase 4B" : "Logical target shell only until source materialization"}</dd></div>
                </dl>

                <div className="phase35-time-schema" aria-label="Temporal hierarchy">
                  <span>BLOCK</span><i>→</i><span>DATE</span><i>→</i><span>TIME</span><i>→</i><span>VARIABLE</span><i>→</i><span>DEPTH</span>
                </div>

                <div className="phase35-baseline-card">
                  <div>
                    <span className="phase35-baseline-badge">ACTIVE LEGACY RENDERER BASELINE</span>
                    <strong>{CURRENT_VERIFIED_BASELINE.id}</strong>
                  </div>
                  <p>{blockBoundsLabel(CURRENT_VERIFIED_BASELINE)}</p>
                  <ul>
                    <li>02 Jan 2024 · daily mean</li>
                    <li>{CURRENT_VERIFIED_BASELINE.depthLevels} verified depth levels</li>
                    <li>Temperature · Salinity · horizontal currents</li>
                  </ul>
                  <small>Phase 3.5B has materialized {pilotCount ?? "source-backed"} additional geographic pilot payloads. Phase 4A maps that evidence honestly; Phase 4B is the controlled step that will make a selected pilot replace this baseline in the active Water Column renderer.</small>
                </div>
              </aside>
            </div>

            <footer className="phase35-block-footer">
              <strong>PHASE 4A SCIENTIFIC BOUNDARY</strong>
              <span>Source-backed pilot evidence is real and checksummed. Geographic availability is active now; pilot Water Column values are not activated until Phase 4B, so no baseline values are copied or relabelled as pilot science.</span>
            </footer>
          </aside>
        </>
      )}
    </div>
  );
}
