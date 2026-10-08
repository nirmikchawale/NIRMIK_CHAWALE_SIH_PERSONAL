import { useEffect, useMemo, useRef, useState } from "react";

import { CURRENT_VERIFIED_BASELINE } from "../main-block-engine";
import {
  PHASE35B_PILOT_IDS,
  publishActiveMainBlockId
} from "../main-block-runtime";
import type { PageId } from "../navigation";
import {
  buildScientificContextDeepLink,
  publishScientificWorkspaceContext,
  readScientificWorkspaceContext,
  sourceLabel,
  subscribeScientificWorkspaceContext,
  variableLabel,
  type ScientificWorkspaceContext
} from "../scientific-context-runtime";

interface Props {
  page: PageId;
  onNavigate: (page: PageId) => void;
  scientificDisclaimer: string;
  degradedWarnings: string[];
}

function timeLabel(context: ScientificWorkspaceContext): string {
  if (!context.timestamp) return "Unavailable";
  const date = new Date(context.timestamp);
  if (Number.isNaN(date.getTime())) return context.timestamp;
  return `${date.toISOString().slice(0, 10)} · ${date.toISOString().slice(11, 16)} UTC`;
}

function depthLabel(context: ScientificWorkspaceContext): string {
  if (context.depthM != null) return `${context.depthM.toFixed(2)} m`;
  return context.variable === "chlorophyll" ? "Surface only" : "Not selected";
}

function copyTextFallback(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Copy command unavailable");
}

export function ScientificContextHeader({ page, onNavigate, scientificDisclaimer, degradedWarnings }: Props) {
  const [context, setContext] = useState(readScientificWorkspaceContext);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    setContext(readScientificWorkspaceContext());
    return subscribeScientificWorkspaceContext(setContext);
  }, []);

  useEffect(() => {
    if (page !== "compare") return;

    // Preserve the existing verified-profile bridge without coupling comparison
    // calculations or downloads to global shell state.
    const syncCompareProfile = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) return;
      if (!target.closest(".comparison-selector-card")) return;
      const selectedProfileId = target.value.trim();
      if (!selectedProfileId) return;
      publishScientificWorkspaceContext({ selectedProfileId, origin: "compare" });
    };

    document.addEventListener("change", syncCompareProfile);
    return () => document.removeEventListener("change", syncCompareProfile);
  }, [page]);

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [page]);

  useEffect(() => {
    if (copyState === "idle") return;
    const timer = window.setTimeout(() => setCopyState("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const planned = context.blockMaterialization === "planned";
  const pilot = context.blockMaterialization === "pilot";
  const statusLabel = planned ? "PLANNED TARGET" : pilot ? "MATERIALIZED PILOT" : "VERIFIED BASELINE";
  const deepLink = useMemo(() => buildScientificContextDeepLink(page, context), [context, page]);
  const materializedIds = useMemo<string[]>(
    () => [CURRENT_VERIFIED_BASELINE.id, ...PHASE35B_PILOT_IDS],
    []
  );
  const currentMaterializedIndex = materializedIds.indexOf(context.blockId);
  const canStepMaterialized = currentMaterializedIndex >= 0;
  const evidenceDegraded = degradedWarnings.length > 0;

  const stepMaterialized = (direction: -1 | 1) => {
    const baseIndex = currentMaterializedIndex >= 0 ? currentMaterializedIndex : 0;
    const nextIndex = (baseIndex + direction + materializedIds.length) % materializedIds.length;
    publishActiveMainBlockId(materializedIds[nextIndex]);
  };

  const copyDeepLink = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(deepLink);
      else copyTextFallback(deepLink);
      setCopyState("copied");
    } catch {
      try {
        copyTextFallback(deepLink);
        setCopyState("copied");
      } catch {
        setCopyState("error");
      }
    }
  };

  return (
    <section
      className="scientific-context-header"
      data-testid="scientific-context-header"
      aria-label="Active scientific context"
    >
      <div
        className="scientific-context-bar"
        data-testid="scientific-context-bar"
        data-block-id={context.blockId}
        data-block-materialization={context.blockMaterialization}
        data-source-mode={context.sourceMode}
        data-variable={context.variable}
        data-time-kind={context.timeKind}
        data-selected-profile-id={context.selectedProfileId ?? ""}
        data-context-deep-link={deepLink}
      >
        <div className="scientific-context-identity">
          <span className="scientific-context-kicker">SCIENTIFIC CONTEXT</span>
          <strong>{context.blockId}</strong>
          <span className={`scientific-context-state ${planned ? "planned" : pilot ? "pilot" : "verified"}`}>
            {statusLabel}
          </span>
        </div>

        <p className="scientific-context-inline" aria-label="Selected scientific source and variable">
          <span title={sourceLabel(context.sourceMode, context.blockMaterialization)}>{sourceLabel(context.sourceMode, context.blockMaterialization)}</span>
          <span aria-hidden="true">·</span>
          <span title={variableLabel(context.variable)}>{variableLabel(context.variable)}</span>
        </p>

        <details ref={detailsRef} className="scientific-context-details"
          onKeyDown={(event) => {
            if (event.key === "Escape" && detailsRef.current?.open) {
              event.preventDefault();
              detailsRef.current.open = false;
              detailsRef.current.querySelector<HTMLElement>("summary")?.focus();
            }
          }}>
          <summary aria-label="Scientific context details">
            <span>Context &amp; Info</span>
            <span aria-hidden="true">⌄</span>
          </summary>
          <div className="scientific-context-panel">
            <div className="scientific-context-panel-heading">
              <div>
                <span>ACTIVE SCIENTIFIC SELECTION</span>
                <strong>{context.blockId}</strong>
              </div>
              <span className={`scientific-context-state ${planned ? "planned" : pilot ? "pilot" : "verified"}`}>
                {statusLabel}
              </span>
            </div>

            <div className="scientific-context-panel-intro">
              <strong>Context &amp; Info</strong>
              <p>Live scientific selection shared across Ocean Canvas workspaces. The Explorer Active Main Block and Sources &amp; QC remain the dedicated block and evidence controls.</p>
            </div>

            <dl className="scientific-context-summary" aria-label="Current scientific selection">
              <div data-context-field="source">
                <dt>Source</dt>
                <dd>{sourceLabel(context.sourceMode, context.blockMaterialization)}</dd>
              </div>
              <div data-context-field="variable">
                <dt>Variable</dt>
                <dd>{variableLabel(context.variable)}</dd>
              </div>
              <div data-context-field="time">
                <dt>Time</dt>
                <dd>{timeLabel(context)}</dd>
              </div>
              <div data-context-field="depth">
                <dt>Depth</dt>
                <dd>{depthLabel(context)}</dd>
              </div>
              <div data-context-field="profile">
                <dt>Profile</dt>
                <dd>{context.selectedProfileId ?? "Not selected"}</dd>
              </div>
            </dl>

            <dl className="scientific-context-metadata">
              <div><dt>Region</dt><dd>{context.blockRegion}</dd></div>
              <div><dt>Origin</dt><dd>{context.origin}</dd></div>
              <div><dt>Time kind</dt><dd>{context.timeKind}</dd></div>
            </dl>

            <div className="scientific-context-materialized-control" data-testid="scientific-context-materialized-control">
              <label htmlFor="scientific-context-block-select">
                <span>Scientific block</span>
                <select
                  id="scientific-context-block-select"
                  aria-label="Active materialized scientific block"
                  value={context.blockId}
                  onChange={(event) => publishActiveMainBlockId(event.target.value)}
                >
                  {planned && (
                    <option value={context.blockId} disabled>
                      {context.blockId} · planned geography only
                    </option>
                  )}
                  <option value={CURRENT_VERIFIED_BASELINE.id}>BASE-GLORYS-001 · verified baseline</option>
                  {PHASE35B_PILOT_IDS.map((id) => (
                    <option key={id} value={id}>{id} · source-backed pilot</option>
                  ))}
                </select>
              </label>
              <div className="scientific-context-stepper" role="group" aria-label="Materialized block navigation">
                <button
                  type="button"
                  aria-label="Previous materialized scientific block"
                  disabled={!canStepMaterialized}
                  title={canStepMaterialized ? "Previous materialized scientific block" : "Select a materialized scientific block before stepping"}
                  onClick={() => stepMaterialized(-1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label="Next materialized scientific block"
                  disabled={!canStepMaterialized}
                  title={canStepMaterialized ? "Next materialized scientific block" : "Select a materialized scientific block before stepping"}
                  onClick={() => stepMaterialized(1)}
                >
                  →
                </button>
              </div>
            </div>

            <div className={`scientific-context-status ${planned ? "planned" : pilot ? "pilot" : "verified"}`}>
              <strong>
                {planned
                  ? "Geographic selection only"
                  : pilot
                    ? "Source-backed pilot volume active"
                    : "Source-backed scientific context"}
              </strong>
              <span>
                {planned
                  ? "This block has no materialized scientific volume yet. Analysis workspaces remain anchored to verified source evidence until genuine block data is available."
                  : pilot
                    ? "This main block is rendered from genuine Phase 3.5B GLORYS12V1 payloads. Geographic and Water Column 3D views use the same block, native time, variable and depth context; no synthetic values are introduced."
                    : "Block, time, variable, depth and verified profile can travel between compatible Ocean Canvas workspaces."}
              </span>
            </div>

            <div className="scientific-context-actions">
              {page !== "explore" && (
                <button type="button" className="scientific-context-return" onClick={() => onNavigate("explore")}>
                  Open context in 3D Explorer
                </button>
              )}
              <button
                type="button"
                className="scientific-context-copy"
                aria-label="Copy shareable scientific context link"
                onClick={copyDeepLink}
              >
                {copyState === "copied" ? "Context link copied" : copyState === "error" ? "Copy unavailable" : "Copy context link"}
              </button>
            </div>

            <div className={`scientific-context-integrity ${evidenceDegraded ? "degraded" : "verified"}`}>
              <div>
                <strong>{evidenceDegraded ? "Degraded evidence state" : "Verified cached evidence"}</strong>
                <span>
                  Reanalysis · Cached verified · No runtime scientific-data download
                  {evidenceDegraded ? ` · Degraded: ${degradedWarnings.join(" · ")}` : ""}
                </span>
              </div>
              <p>
                <strong>Scientific disclaimer:</strong> {scientificDisclaimer}
              </p>
            </div>

            <p className="scientific-context-link-note">
              The context link records the active block, source, variable, depth, native time and selected profile when available.
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}
