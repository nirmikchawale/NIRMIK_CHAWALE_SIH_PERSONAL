import { useEffect, useMemo, useState } from "react";

import { blockBoundsLabel } from "../main-block-engine";
import { fetchPilotMainBlockManifest, type PilotBlockManifest } from "../pilot-main-block-loader";
import {
  isPhase35bPilotId,
  publishActiveMainBlockId,
  readActiveMainBlockId,
  resolveMainBlock,
  subscribeActiveMainBlock
} from "../main-block-runtime";
import {
  readScientificWorkspaceContext,
  subscribeScientificWorkspaceContext,
  type ScientificWorkspaceContext
} from "../scientific-context-runtime";

export function PilotMainBlockRendererBridge() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [activeId, setActiveId] = useState(readActiveMainBlockId);
  const [manifest, setManifest] = useState<PilotBlockManifest | null>(null);
  const [context, setContext] = useState<ScientificWorkspaceContext>(readScientificWorkspaceContext);

  const onExplore = hash === "" || hash === "#" || hash.startsWith("#/explore");
  const activeBlock = resolveMainBlock(activeId);
  const activePilot = useMemo(
    () => manifest?.blocks.find((block) => block.id === activeId && block.materialization === "pilot") ?? null,
    [manifest, activeId]
  );
  const pilot = isPhase35bPilotId(activeId) && activeBlock.materialization === "pilot";

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => subscribeActiveMainBlock(setActiveId), []);
  useEffect(() => subscribeScientificWorkspaceContext(setContext), []);

  useEffect(() => {
    let cancelled = false;
    fetchPilotMainBlockManifest()
      .then((payload) => {
        if (!cancelled) setManifest(payload);
      })
      .catch(() => {
        if (!cancelled) setManifest(null);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.mainBlockMaterialization = pilot ? "pilot" : "verified-baseline";
    document.documentElement.dataset.activeMainBlock = activeId;
    return () => {
      delete document.documentElement.dataset.mainBlockMaterialization;
      delete document.documentElement.dataset.activeMainBlock;
    };
  }, [pilot, activeId]);

  if (!onExplore || !pilot) return null;

  const currentTime = context.blockId === activeId && context.timestamp
    ? context.timestamp.replace("T", " ").replace("Z", " UTC")
    : activePilot?.available_dates[0]
      ? `${activePilot.available_dates[0]} · native daily frame`
      : "Loading native source time…";

  return (
    <aside
      className="pilot-renderer-bridge"
      data-testid="pilot-renderer-bridge"
      data-block-id={activeId}
      data-materialization="pilot"
      aria-label="Active source-backed pilot main block"
    >
      <div className="pilot-renderer-bridge-heading">
        <div>
          <span>SOURCE-BACKED MAIN BLOCK LIVE</span>
          <strong>{activeId} · {activeBlock.region}</strong>
          <small>{blockBoundsLabel(activeBlock)}</small>
        </div>
        <b>{activePilot?.available_dates.length ?? 1} genuine date{(activePilot?.available_dates.length ?? 1) === 1 ? "" : "s"}</b>
      </div>
      <div className="pilot-renderer-bridge-status">
        <span><i /> Geographic 3D</span>
        <span><i /> Water Column 3D</span>
        <strong>SYNCHRONIZED</strong>
      </div>
      <dl>
        <div><dt>Native time</dt><dd>{currentTime}</dd></div>
        <div><dt>Source</dt><dd>GLORYS12V1 · Phase 3.5B payload</dd></div>
        <div><dt>Coverage</dt><dd>{activePilot ? `${(activePilot.ocean_fraction * 100).toFixed(1)}% ocean/finite footprint` : "Source-backed pilot"}</dd></div>
        <div><dt>Integrity</dt><dd>No synthetic values · uo/vo only for currents</dd></div>
      </dl>
      <p>
        The visible geographic field, depth slices, Water Column 3D, telemetry and anomaly screen are hydrated from this block's exact retained source payload. Planned cells cannot replace it.
      </p>
      <button
        type="button"
        data-testid="pilot-return-baseline"
        onClick={() => publishActiveMainBlockId("BASE-GLORYS-001")}
      >
        Return to verified demo baseline
      </button>
    </aside>
  );
}
