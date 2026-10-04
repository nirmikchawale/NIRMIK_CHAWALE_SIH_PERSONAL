import { useEffect, useRef, useState } from "react";

import type { PageId } from "../navigation";
import {
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

export function ScientificContextBar({ page, onNavigate }: Props) {
  const [context, setContext] = useState(readScientificWorkspaceContext);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    setContext(readScientificWorkspaceContext());
    return subscribeScientificWorkspaceContext(setContext);
  }, []);

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = page !== "explore";
  }, [page]);

  const planned = context.blockMaterialization === "planned";
  const pilot = context.blockMaterialization === "pilot";
  const statusLabel = planned ? "PLANNED TARGET" : pilot ? "MATERIALIZED PILOT" : "VERIFIED BASELINE";

  return (
    <section
      className="scientific-context-bar"
      data-testid="scientific-context-bar"
      data-block-id={context.blockId}
      data-block-materialization={context.blockMaterialization}
      data-source-mode={context.sourceMode}
      data-variable={context.variable}
      data-time-kind={context.timeKind}
    >
      <div className="scientific-context-kicker">SHARED SCIENTIFIC CONTEXT</div>
      <details ref={detailsRef}>
        <summary>
          <span>{context.blockId}</span>
          <strong>{statusLabel}</strong>
        </summary>
        <dl>
          <div><dt>Region</dt><dd>{context.blockRegion}</dd></div>
          <div><dt>Source</dt><dd>{sourceLabel(context.sourceMode, context.blockMaterialization)}</dd></div>
          <div><dt>Time</dt><dd>{timeLabel(context)}</dd></div>
          <div><dt>Variable</dt><dd>{variableLabel(context.variable)}</dd></div>
          <div><dt>Depth</dt><dd>{context.depthM == null ? (context.variable === "chlorophyll" ? "Surface only" : "Not selected") : `${context.depthM.toFixed(2)} m`}</dd></div>
        </dl>
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
                : "Block, time, variable and depth can now travel between compatible Ocean Canvas workspaces."}
          </span>
        </div>
        {page !== "explore" && (
          <button type="button" className="scientific-context-return" onClick={() => onNavigate("explore")}>
            Open context in 3D Explorer
          </button>
        )}
      </details>
    </section>
  );
}
