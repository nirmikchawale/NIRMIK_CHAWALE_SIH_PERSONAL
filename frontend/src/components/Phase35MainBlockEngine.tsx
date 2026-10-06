import { useEffect, useMemo, useState } from "react";

import {
  MAIN_BLOCK_ENGINE_VERSION,
  MAIN_BLOCK_REGIONS,
  TARGET_BLOCK_COUNT,
  TARGET_DOMAIN,
  blockBoundsLabel,
  type MainBlockRegion,
  type OceanMainBlock
} from "../main-block-engine";
import {
  LAND_ONLY_BLOCK_COUNT,
  OCEAN_INTERSECTING_BLOCK_COUNT,
  OCEAN_INTERSECTING_MAIN_BLOCKS,
  oceanCoverageYellowGradient
} from "../main-block-ocean-mask";
import {
  fetchPilotMainBlockManifest,
  type PilotBlockManifest,
  type PilotBlockManifestEntry
} from "../pilot-main-block-loader";
import {
  PHASE35B_PILOT_IDS,
  publishActiveMainBlockId,
  readActiveMainBlockId,
  subscribeActiveMainBlock
} from "../main-block-runtime";

const PREVIEW_STORAGE_KEY = "oceancanvas-main-block-preview-v1";
type RegionFilter = "all" | MainBlockRegion;

function initialPreviewId(): string {
  try {
    const stored = window.localStorage.getItem(PREVIEW_STORAGE_KEY);
    return OCEAN_INTERSECTING_MAIN_BLOCKS.some((block) => block.id === stored) ? stored! : "IO-001";
  } catch {
    return "IO-001";
  }
}

function formatTargetCount(value: number): string {
  return value.toLocaleString("en-IN");
}

function pilotDateLabel(entry: PilotBlockManifestEntry | null): string {
  if (!entry || entry.available_dates.length === 0) return "No source frame materialized";
  return entry.available_dates.join(" · ");
}

export function Phase35MainBlockEngine() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(initialPreviewId);
  const [activeId, setActiveId] = useState(readActiveMainBlockId);
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [query, setQuery] = useState("");
  const [manifest, setManifest] = useState<PilotBlockManifest | null>(null);
  const [manifestError, setManifestError] = useState("");

  const onExploreRoute = hash === "" || hash === "#" || hash.startsWith("#/explore");
  const selected = OCEAN_INTERSECTING_MAIN_BLOCKS.find((block) => block.id === selectedId) ?? OCEAN_INTERSECTING_MAIN_BLOCKS[0];
  const manifestById = useMemo(
    () => new Map((manifest?.blocks ?? []).map((entry) => [entry.id, entry])),
    [manifest]
  );
  const selectedManifest = manifestById.get(selected.id) ?? null;
  const selectedMaterialization = selectedManifest?.materialization ?? (PHASE35B_PILOT_IDS.includes(selected.id as typeof PHASE35B_PILOT_IDS[number]) ? "pilot" : "planned");
  const selectedIsPilot = selectedMaterialization === "pilot";
  const selectedIsActive = selectedIsPilot && selected.id === activeId;

  const visibleBlocks = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return OCEAN_INTERSECTING_MAIN_BLOCKS.filter((block) => {
      const regionMatch = regionFilter === "all" || block.region === regionFilter;
      const manifestEntry = manifestById.get(block.id);
      const statusText = manifestEntry?.materialization === "pilot" ? "materialized pilot source-backed" : "planned";
      const textMatch = !cleanQuery || `${block.id} ${block.region} ${blockBoundsLabel(block)} ${statusText}`.toLowerCase().includes(cleanQuery);
      return regionMatch && textMatch;
    });
  }, [query, regionFilter, manifestById]);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => subscribeActiveMainBlock(setActiveId), []);

  useEffect(() => {
    let cancelled = false;
    fetchPilotMainBlockManifest()
      .then((payload) => {
        if (cancelled) return;
        if (
          payload.integrity.synthetic_measurements ||
          payload.integrity.synthetic_timestamps ||
          payload.integrity.synthetic_coordinates ||
          payload.integrity.synthetic_depths ||
          payload.integrity.vertical_component_available
        ) {
          throw new Error("Phase 3.5B manifest failed the scientific-integrity policy.");
        }
        setManifest(payload);
        setManifestError("");
      })
      .catch((reason: Error) => {
        if (cancelled) return;
        setManifest(null);
        setManifestError(reason.message);
      });
    return () => { cancelled = true; };
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

  const pilotCount = manifest?.integrity.pilot_block_count ?? PHASE35B_PILOT_IDS.length;
  const multiDateCount = manifest?.integrity.multi_date_pilot_count ?? 6;

  const selectBlock = (block: OceanMainBlock) => {
    setSelectedId(block.id);
  };

  return (
    <div className="phase35-block-engine-root" data-phase="3.5d" data-testid="phase35-main-block-engine">
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
            <small>{pilotCount} source-backed pilots · {OCEAN_INTERSECTING_BLOCK_COUNT} ocean-intersecting blocks</small>
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
                <span className="phase35-kicker">PHASE 3.5D · {MAIN_BLOCK_ENGINE_VERSION}</span>
                <h2>Indian Ocean Main Block Engine</h2>
                <p>
                  {OCEAN_INTERSECTING_BLOCK_COUNT} ocean-intersecting extraction cells are retained from the {TARGET_BLOCK_COUNT}-cell logical grid spanning {TARGET_DOMAIN.west}–{TARGET_DOMAIN.east}°E and {TARGET_DOMAIN.south}–{TARGET_DOMAIN.north}°N. <strong>{LAND_ONLY_BLOCK_COUNT} zero-ocean land cells are suppressed</strong>; mixed ocean+land cells remain available.
                </p>
              </div>
              <button type="button" className="phase35-block-close" onClick={() => setOpen(false)} aria-label="Close main block engine">×</button>
            </header>

            <section className="phase35-block-summary" aria-label="Block engine status" data-testid="phase35-materialization-summary">
              <article>
                <small>OCEAN-INTERSECTING BLOCKS</small>
                <strong>{formatTargetCount(OCEAN_INTERSECTING_BLOCK_COUNT)}</strong>
                <span>ocean-only + mixed coastal cells</span>
              </article>
              <article className="materialized">
                <small>SOURCE-BACKED PILOTS</small>
                <strong>{pilotCount}</strong>
                <span>genuine GLORYS12V1 volumes</span>
              </article>
              <article>
                <small>MULTI-DATE PILOTS</small>
                <strong>{multiDateCount}</strong>
                <span>genuine native source frames</span>
              </article>
              <article>
                <small>LAND-ONLY EXCLUDED</small>
                <strong>{LAND_ONLY_BLOCK_COUNT}</strong>
                <span>0% ocean footprint</span>
              </article>
            </section>

            {manifestError && (
              <div className="phase35-manifest-warning" role="alert">
                Pilot manifest could not be loaded: {manifestError}. Planning geometry remains available, but source-backed activation is disabled.
              </div>
            )}

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
                    <span>Find block</span>
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="IO-045 or materialized pilot" />
                  </label>
                  <div className="phase35-block-result-count" aria-live="polite">
                    <strong>{visibleBlocks.length}</strong>
                    <span>shown of {OCEAN_INTERSECTING_BLOCK_COUNT} ocean blocks</span>
                  </div>
                </div>

                <div className="phase35-grid-note">
                  <span>Ocean-intersecting cells from the canonical 14 × 10 source grid</span>
                  <span>Yellow light → dark = lower → higher ocean coverage · land-only cells removed</span>
                </div>

                <div className="phase35-block-grid" role="group" aria-label="Ocean-intersecting Indian Ocean main blocks">
                  {visibleBlocks.map((block) => {
                    const active = block.id === selected.id;
                    const sourceEntry = manifestById.get(block.id);
                    const materialization = sourceEntry?.materialization ?? "planned";
                    const isPilot = materialization === "pilot";
                    const oceanFraction = sourceEntry?.ocean_fraction ?? 0.5;
                    return (
                      <button
                        key={block.id}
                        type="button"
                        className={`phase35-block-cell ${active ? "active" : ""} ${isPilot ? "materialized" : ""}`}
                        aria-pressed={active}
                        aria-label={`${block.id}, ${block.region}, ${blockBoundsLabel(block)}, ${isPilot ? "source-backed materialized pilot" : "planned main block"}`}
                        data-block-id={block.id}
                        data-materialization={materialization}
                        data-ocean-fraction={oceanFraction.toFixed(6)}
                        style={{ background: oceanCoverageYellowGradient(oceanFraction) }}
                        onClick={() => selectBlock(block)}
                      >
                        <strong>{block.id.replace("IO-", "")}</strong>
                        <span>{isPilot ? "LIVE DATA" : `${block.west}–${block.east}E`}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <aside className="phase35-block-inspector" aria-label="Selected block details">
                <div className={`phase35-inspector-status ${selectedIsPilot ? "materialized" : "planned"}`}>
                  <span>{selectedIsPilot ? "MATERIALIZED · SOURCE-BACKED" : "LOGICAL TARGET · NOT YET DOWNLOADED"}</span>
                  <strong>{selected.id}</strong>
                </div>
                <h3>{selected.region}</h3>
                <p className="phase35-selected-bounds">{blockBoundsLabel(selected)}</p>

                {selectedIsPilot && selectedManifest ? (
                  <>
                    <dl className="phase35-block-facts">
                      <div><dt>Scientific source</dt><dd>{manifest?.source.origin_product ?? "Copernicus Marine / Mercator Ocean GLORYS12V1"}</dd></div>
                      <div><dt>Archive transport</dt><dd>{manifest?.source.archive_provider ?? "NCAR GDEX THREDDS"} · OPeNDAP DAP2</dd></div>
                      <div><dt>Variables</dt><dd>Temperature · Salinity · horizontal currents (uo/vo)</dd></div>
                      <div><dt>Native dates</dt><dd>{pilotDateLabel(selectedManifest)}</dd></div>
                      <div><dt>Depth evidence</dt><dd>31 retained source levels · to ~453.94 m</dd></div>
                      <div><dt>Ocean relevance</dt><dd>{selectedManifest.ocean_relevance} · {(selectedManifest.ocean_fraction * 100).toFixed(1)}% finite/ocean sampling footprint</dd></div>
                      <div><dt>Payload integrity</dt><dd>{selectedManifest.payloads.length} checksum-addressed JSON payload{selectedManifest.payloads.length === 1 ? "" : "s"} · no synthetic values</dd></div>
                    </dl>

                    <div className="phase35-time-schema" aria-label="Active scientific hierarchy">
                      <span>BLOCK</span><i>→</i><span>NATIVE DATE</span><i>→</i><span>VARIABLE</span><i>→</i><span>DEPTH</span><i>→</i><span>3D</span>
                    </div>

                    <button
                      type="button"
                      className="phase35-activate-block"
                      data-testid="phase35-activate-pilot"
                      disabled={selectedIsActive || !manifest}
                      onClick={() => publishActiveMainBlockId(selected.id)}
                    >
                      {selectedIsActive ? "ACTIVE IN GEOGRAPHIC + WATER COLUMN 3D" : `Load ${selected.id} in Geographic + Water Column 3D`}
                    </button>
                    <small className="phase35-activation-note">
                      Activation refreshes the scientific catalog and native timeline in place. The page does not reload and block selection never auto-opens Water Column 3D.
                    </small>
                  </>
                ) : (
                  <>
                    <dl className="phase35-block-facts">
                      <div><dt>Source plan</dt><dd>GLORYS12V1 historical field when genuinely acquired</dd></div>
                      <div><dt>Variables planned</dt><dd>Temperature · Salinity · horizontal currents</dd></div>
                      <div><dt>Historical schema</dt><dd>Exact native daily source frames</dd></div>
                      <div><dt>Data status</dt><dd>No scientific payload is bundled for this cell yet</dd></div>
                      <div><dt>Renderer policy</dt><dd>Planning geometry can be inspected, but cannot replace the active scientific field</dd></div>
                    </dl>
                    <div className="phase35-planned-lock">SCIENTIFIC RENDERER LOCKED · materialize genuine source evidence first</div>
                  </>
                )}


              </aside>
            </div>

            <footer className="phase35-block-footer">
              <strong>SCIENTIFIC BOUNDARY</strong>
              <span>{OCEAN_INTERSECTING_BLOCK_COUNT} ocean-intersecting blocks remain visible; {LAND_ONLY_BLOCK_COUNT} zero-ocean land cells are removed from exploration. {pilotCount} retained blocks are genuinely materialized and the others remain fail-closed planning geography.</span>
            </footer>
          </aside>
        </>
      )}
    </div>
  );
}
