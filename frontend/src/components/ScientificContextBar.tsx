import { useEffect, useMemo, useRef, useState } from "react";

import { CURRENT_VERIFIED_BASELINE } from "../main-block-engine";
import {
  PHASE35B_PILOT_IDS,
  publishActiveMainBlockId
} from "../main-block-runtime";
import type { PageId } from "../navigation";
import {
  buildScientificContextDeepLink,
  readScientificWorkspaceContext,
  sourceLabel,
  subscribeScientificWorkspaceContext,
  variableLabel,
  type ScientificWorkspaceContext
} from "../scientific-context-runtime";

interface Props {
  page: PageId;
  onNavigate: (page: PageId) => void;
}

function timeLabel(context: ScientificWorkspaceContext): string {
  if (!context.timestamp) return "Unavailable";
  const date = new Date(context.timestamp);
  if (Number.isNaN(date.getTime())) return context.timestamp;
  return `${date.toISOString().slice(0, 10)} · ${date.toISOString().slice(11, 16)} UTC`;
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

export function ScientificContextBar({ page, onNavigate }: Props) {
  const [context, setContext] = useState(readScientificWorkspaceContext);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    setContext(readScientificWorkspaceContext());
    return subscribeScientificWorkspaceContext(setContext);
  }, []);

  useEffect(() => {
    const details = detailsRef.current;
    if (!details) return;
    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const syncDisclosure = () => {
      details.open = !mobileQuery.matches && page !== "explore";
    };
    syncDisclosure();
    mobileQuery.addEventListener?.("change", syncDisclosure);
    return () => mobileQuery.removeEventListener?.("change", syncDisclosure);
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
      className="scientific-context-bar"
      data-testid="scientific-context-bar"
      data-block-id={context.blockId}
      data-block-materialization={context.blockMaterialization}
      data-source-mode={context.sourceMode}
      data-variable={context.variable}
      data-time-kind={context.timeKind}
      data-context-deep-link={deepLink}
    >
      <div className="scientific-context-kicker">SHARED SCIENTIFIC CONTEXT</div>
      <details ref={detailsRef}>
        <summary>
          <span>{context.blockId}</span>
          <strong>{statusLabel}</strong>
        </summary>
        <div className="scientific-context-panel">
          <dl>
            <div><dt>Region</dt><dd>{context.blockRegion}</dd></div>
            <div><dt>Source</dt><dd>{sourceLabel(context.sourceMode, context.blockMaterialization)}</dd></div>
            <div><dt>Time</dt><dd>{timeLabel(context)}</dd></div>
            <div><dt>Variable</dt><dd>{variableLabel(context.variable)}</dd></div>
            <div><dt>Depth</dt><dd>{context.depthM == null ? (context.variable === "chlorophyll" ? "Surface only" : "Not selected") : `${context.depthM.toFixed(2)} m`}</dd></div>
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
                onClick={() => stepMaterialized(-1)}
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Next materialized scientific block"
                disabled={!canStepMaterialized}
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
                  : "Block, time, variable and depth can travel between compatible Ocean Canvas workspaces."}
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
          <p className="scientific-context-link-note">
            The context link records the active block, source, variable, depth, native time and selected profile when available.
          </p>
        </div>
      </details>
    </section>
  );
}
