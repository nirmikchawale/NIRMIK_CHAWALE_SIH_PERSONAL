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

const PREVIEW_STORAGE_KEY = "oceancanvas-main-block-preview-v1";

type RegionFilter = "all" | MainBlockRegion;

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

export function Phase35MainBlockEngine() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(initialPreviewId);
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [query, setQuery] = useState("");

  const onExploreRoute = hash === "" || hash === "#" || hash.startsWith("#/explore");
  const selected = INDIAN_OCEAN_MAIN_BLOCKS.find((block) => block.id === selectedId) ?? INDIAN_OCEAN_MAIN_BLOCKS[0];

  const visibleBlocks = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return INDIAN_OCEAN_MAIN_BLOCKS.filter((block) => {
      const regionMatch = regionFilter === "all" || block.region === regionFilter;
      const textMatch = !cleanQuery || `${block.id} ${block.region} ${blockBoundsLabel(block)}`.toLowerCase().includes(cleanQuery);
      return regionMatch && textMatch;
    });
  }, [query, regionFilter]);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
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

  return (
    <div className="phase35-block-engine-root" data-phase="3.5a" data-testid="phase35-main-block-engine">
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
            <small>140 target main blocks · Phase 3.5A</small>
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
                <span className="phase35-kicker">PHASE 3.5A · {MAIN_BLOCK_ENGINE_VERSION}</span>
                <h2>Indian Ocean Main Block Engine</h2>
                <p>
                  A time-ready logical index for {TARGET_BLOCK_COUNT} future <strong>main blocks</strong> across {TARGET_DOMAIN.west}–{TARGET_DOMAIN.east}°E and {TARGET_DOMAIN.south}–{TARGET_DOMAIN.north}°N. These are target extraction regions, not subdivisions of the current GLORYS block.
                </p>
              </div>
              <button type="button" className="phase35-block-close" onClick={() => setOpen(false)} aria-label="Close main block engine">×</button>
            </header>

            <section className="phase35-block-summary" aria-label="Block engine status">
              <article>
                <small>LOGICAL TARGETS</small>
                <strong>{formatTargetCount(TARGET_BLOCK_COUNT)}</strong>
                <span>future main-block positions</span>
              </article>
              <article>
                <small>NEWLY MATERIALIZED</small>
                <strong>0</strong>
                <span>Phase 3.5B acquires real new blocks</span>
              </article>
              <article className="verified">
                <small>CURRENT VERIFIED BASELINE</small>
                <strong>1</strong>
                <span>{blockBoundsLabel(CURRENT_VERIFIED_BASELINE)}</span>
              </article>
              <article>
                <small>TIME MODEL</small>
                <strong>Ready</strong>
                <span>date → native time → variable → depth</span>
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
                    <span>Find block</span>
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="IO-047 or Bay of Bengal" />
                  </label>
                  <div className="phase35-block-result-count" aria-live="polite">
                    <strong>{visibleBlocks.length}</strong>
                    <span>shown of {TARGET_BLOCK_COUNT}</span>
                  </div>
                </div>

                <div className="phase35-grid-note">
                  <span>Schematic 14 × 10 planning grid</span>
                  <span>Highlighted outline = target cell intersects the current verified baseline footprint</span>
                </div>

                <div className="phase35-block-grid" role="group" aria-label="140 logical Indian Ocean main blocks">
                  {visibleBlocks.map((block) => {
                    const active = block.id === selected.id;
                    const overlapsCurrent = intersectsBaseline(block);
                    return (
                      <button
                        key={block.id}
                        type="button"
                        className={`phase35-block-cell ${active ? "active" : ""} ${overlapsCurrent ? "baseline-overlap" : ""}`}
                        aria-pressed={active}
                        aria-label={`${block.id}, ${block.region}, ${blockBoundsLabel(block)}, planned main block`}
                        data-block-id={block.id}
                        data-materialization="planned"
                        onClick={() => selectBlock(block)}
                      >
                        <strong>{block.id.replace("IO-", "")}</strong>
                        <span>{block.west}–{block.east}E</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <aside className="phase35-block-inspector" aria-label="Selected block details">
                <div className="phase35-inspector-status planned">
                  <span>LOGICAL TARGET · NOT YET DOWNLOADED</span>
                  <strong>{selected.id}</strong>
                </div>
                <h3>{selected.region}</h3>
                <p className="phase35-selected-bounds">{blockBoundsLabel(selected)}</p>

                <dl className="phase35-block-facts">
                  <div><dt>Source plan</dt><dd>GLORYS12V1 historical + verified operational companion</dd></div>
                  <div><dt>Variables</dt><dd>Temperature · Salinity · Currents</dd></div>
                  <div><dt>Historical schema</dt><dd>Daily source frames</dd></div>
                  <div><dt>Operational schema</dt><dd>Native sub-daily timestamps when acquired</dd></div>
                  <div><dt>Interpolation</dt><dd>Reserved with mandatory INTERPOLATED disclosure</dd></div>
                  <div><dt>Data status</dt><dd>No new values are bundled for this target in Phase 3.5A</dd></div>
                </dl>

                <div className="phase35-time-schema" aria-label="Future temporal hierarchy">
                  <span>BLOCK</span><i>→</i><span>DATE</span><i>→</i><span>TIME</span><i>→</i><span>VARIABLE</span><i>→</i><span>DEPTH</span>
                </div>

                <div className="phase35-baseline-card">
                  <div>
                    <span className="phase35-baseline-badge">VERIFIED NOW</span>
                    <strong>{CURRENT_VERIFIED_BASELINE.id}</strong>
                  </div>
                  <p>{blockBoundsLabel(CURRENT_VERIFIED_BASELINE)}</p>
                  <ul>
                    <li>02 Jan 2024 · daily mean</li>
                    <li>{CURRENT_VERIFIED_BASELINE.depthLevels} verified depth levels</li>
                    <li>Temperature · Salinity · horizontal currents</li>
                  </ul>
                  <small>The current verified block remains the only materialized GLORYS main volume in Phase 3.5A. Phase 3.5B will add genuinely different geographic blocks.</small>
                </div>
              </aside>
            </div>

            <footer className="phase35-block-footer">
              <strong>SCIENTIFIC BOUNDARY</strong>
              <span>The 140 cells shown here are a deployment-ready manifest and UI index. They are not claimed as downloaded or verified ocean volumes until Phase 3.5B materializes them from source data.</span>
            </footer>
          </aside>
        </>
      )}
    </div>
  );
}
