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
          <strong>{planned ? "PLANNED TARGET" : "VERIFIED CONTEXT"}</strong>
        </summary>
        <dl>
          <div><dt>Region</dt><dd>{context.blockRegion}</dd></div>
          <div><dt>Source</dt><dd>{sourceLabel(context.sourceMode)}</dd></div>
          <div><dt>Time</dt><dd>{timeLabel(context)}</dd></div>
          <div><dt>Variable</dt><dd>{variableLabel(context.variable)}</dd></div>
          <div><dt>Depth</dt><dd>{context.depthM == null ? (context.variable === "chlorophyll" ? "Surface only" : "Not selected") : `${context.depthM.toFixed(2)} m`}</dd></div>
        </dl>
        <div className={`scientific-context-status ${planned ? "planned" : "verified"}`}>
          <strong>{planned ? "Geographic selection only" : "Source-backed scientific context"}</strong>
          <span>
            {planned
              ? "This block has no materialized scientific volume yet. Analysis workspaces remain anchored to verified source evidence until genuine block data is available."
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
