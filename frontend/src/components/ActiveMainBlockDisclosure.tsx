import { useEffect, useMemo, useState } from "react";

import { CURRENT_VERIFIED_BASELINE } from "../main-block-engine";
import { PHASE35B_PILOT_IDS, publishActiveMainBlockId } from "../main-block-runtime";
import {
  buildScientificContextDeepLink,
  readScientificWorkspaceContext,
  sourceLabel,
  subscribeScientificWorkspaceContext,
  variableLabel
} from "../scientific-context-runtime";
import { MprIcon } from "./MprIcon";

/** MPR-07 is a view of canonical shared context, not an alternate scientific state store. */
export function ActiveMainBlockDisclosure() {
  const [context, setContext] = useState(readScientificWorkspaceContext);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");

  useEffect(() => {
    setContext(readScientificWorkspaceContext());
    return subscribeScientificWorkspaceContext(setContext);
  }, []);

  const materializedIds = useMemo<string[]>(
    () => [CURRENT_VERIFIED_BASELINE.id, ...PHASE35B_PILOT_IDS], []
  );
  const index = materializedIds.indexOf(context.blockId);
  const planned = context.blockMaterialization === "planned";
  const pilot = context.blockMaterialization === "pilot";
  const status = planned ? "PLANNED TARGET" : pilot ? "MATERIALIZED PILOT" : "VERIFIED BASELINE";
  const depth = context.depthM == null
    ? context.variable === "chlorophyll" ? "Surface only" : "Not selected"
    : context.depthM.toFixed(2) + " m";
  const parsedTime = context.timestamp ? Date.parse(context.timestamp) : NaN;
  const time = Number.isFinite(parsedTime)
    ? new Date(parsedTime).toISOString().slice(0, 16).replace("T", " ") + " UTC"
    : context.timestamp || "No native time selected";
  const deepLink = buildScientificContextDeepLink("explore", context);

  const step = (direction: -1 | 1) => {
    if (index < 0) return;
    publishActiveMainBlockId(materializedIds[
      (index + direction + materializedIds.length) % materializedIds.length
    ]);
  };

  const copyLink = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(deepLink);
      setCopyStatus("copied");
    } catch {
      try {
        const input = document.createElement("textarea");
        input.value = deepLink;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const success = document.execCommand("copy");
        input.remove();
        setCopyStatus(success ? "copied" : "unavailable");
      } catch {
        setCopyStatus("unavailable");
      }
    }
  };

  return (
    <details className="mpr-active-block-disclosure" data-testid="mpr-07-active-main-block"
      data-block-id={context.blockId}
      data-materialization={context.blockMaterialization}
      data-source-mode={context.sourceMode}>
      <summary aria-label="Active Main Block details">
        <span className="mpr-active-block-heading">
          <span className="mpr-active-block-kicker"><MprIcon name="block" size={16}/> ACTIVE MAIN BLOCK</span>
          <strong>{context.blockId}</strong>
        </span>
        <span className={"mpr-active-block-status " + (planned ? "planned" : pilot ? "pilot" : "baseline")}>
          {status}
        </span>
        <span className="mpr-active-block-hint">Block, native source and shared scientific selection</span>
        <MprIcon name="expand" size={17}/>
      </summary>
      <div className="mpr-active-block-content">
        <dl className="mpr-active-block-metadata" aria-label="Active main block scientific context">
          <div><dt>Region</dt><dd>{context.blockRegion}</dd></div>
          <div><dt>Scientific source</dt><dd>{sourceLabel(context.sourceMode, context.blockMaterialization)}</dd></div>
          <div><dt>Variable</dt><dd>{variableLabel(context.variable)}</dd></div>
          <div><dt>Native time</dt><dd>{time}</dd></div>
          <div><dt>Depth</dt><dd>{depth}</dd></div>
          <div><dt>Profile</dt><dd>{context.selectedProfileId || "Not selected"}</dd></div>
          <div><dt>Time kind</dt><dd>{context.timeKind}</dd></div>
          <div><dt>Context origin</dt><dd>{context.origin}</dd></div>
        </dl>

        <div className="mpr-active-block-controls">
          <label htmlFor="mpr-active-block-select">
            Choose materialized block
            <select id="mpr-active-block-select"
              aria-label="Active Main Block selector"
              value={context.blockId}
              onChange={event => publishActiveMainBlockId(event.target.value)}>
              {planned && <option value={context.blockId} disabled>{context.blockId} · planned only</option>}
              <option value={CURRENT_VERIFIED_BASELINE.id}>BASE-GLORYS-001 · verified baseline</option>
              {PHASE35B_PILOT_IDS.map(id => <option key={id} value={id}>{id} · source-backed pilot</option>)}
            </select>
          </label>
          <div className="mpr-active-block-stepper" role="group" aria-label="Main block navigation">
            <button type="button" disabled={index < 0} aria-label="Previous materialized main block"
              onClick={() => step(-1)}>Previous</button>
            <button type="button" disabled={index < 0} aria-label="Next materialized main block"
              onClick={() => step(1)}>Next</button>
          </div>
          <button type="button" className="mpr-active-block-link" onClick={copyLink}
            aria-label="Copy active main block context link">
            <MprIcon name="download" size={15}/> Copy context link
          </button>
          <span role="status" aria-live="polite" className="mpr-active-block-copy-status">
            {copyStatus === "copied" ? "Context link copied" :
              copyStatus === "unavailable" ? "Copy unavailable" : ""}
          </span>
        </div>

        <p className="mpr-active-block-truth">
          {planned
            ? "Geographic target only: no materialized water-column volume exists for this block. Select a source-backed block to inspect real evidence."
            : pilot
              ? "Source-backed pilot block. Measurements, native depths and times remain those of its genuine scientific payload."
              : "Verified GLORYS baseline context. The bundled model has one genuine timestamp; no synthetic playback is implied."}
          {" "}The existing Sources &amp; QC controls retain the full provenance and provider-quality evidence.
        </p>
      </div>
    </details>
  );
}
