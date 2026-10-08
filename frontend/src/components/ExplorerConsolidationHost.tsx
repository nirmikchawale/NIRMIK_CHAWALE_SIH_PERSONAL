import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Phase35MainBlockEngine } from "./Phase35MainBlockEngine";
import { Phase3ArabianAtlas } from "./Phase3ArabianAtlas";
import { BlockDetailsWorkspace } from "./BlockDetailsWorkspace";

export function ExplorerConsolidationHost() {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let frameId = 0;
    let attemptsRemaining = 0;
    let ownedSlot: HTMLElement | null = null;
    let observedWorkbench: HTMLElement | null = null;
    let workbenchObserver: MutationObserver | null = null;

    const bindWorkbench = () => {
      const nextWorkbench = document.querySelector<HTMLElement>(".ocean-workbench");
      if (nextWorkbench === observedWorkbench) return;

      workbenchObserver?.disconnect();
      workbenchObserver = null;
      observedWorkbench = nextWorkbench;

      if (observedWorkbench) {
        workbenchObserver = new MutationObserver(() => {
          if (observedWorkbench?.dataset.page === "explore") scheduleAttachment(30);
          else setPortalTarget((current) => current === null ? current : null);
        });
        workbenchObserver.observe(observedWorkbench, {
          attributes: true,
          attributeFilter: ["class", "data-workspace-mode", "data-page"]
        });
      }
    };

    const attachPortal = () => {
      frameId = 0;
      if (disposed) return;

      bindWorkbench();
      const workspace = document.querySelector<HTMLElement>(".station-workspace");
      if (workspace) {
        let slot = workspace.querySelector<HTMLElement>(":scope > [data-rui-nav-02-slot]");
        if (!slot) {
          slot = document.createElement("div");
          slot.className = "explorer-consolidation-slot";
          slot.dataset.ruiNav02Slot = "true";
          workspace.prepend(slot);
          ownedSlot = slot;
        }
        setPortalTarget((current) => current === slot ? current : slot);
        return;
      }

      setPortalTarget((current) => current === null ? current : null);
      if (attemptsRemaining > 0) {
        attemptsRemaining -= 1;
        frameId = window.requestAnimationFrame(attachPortal);
      }
    };

    function scheduleAttachment(maxFrames = 180) {
      if (disposed) return;
      attemptsRemaining = Math.max(attemptsRemaining, maxFrames);
      if (!frameId) frameId = window.requestAnimationFrame(attachPortal);
    }

    const handleHashChange = () => scheduleAttachment(180);

    scheduleAttachment(180);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      disposed = true;
      if (frameId) window.cancelAnimationFrame(frameId);
      workbenchObserver?.disconnect();
      window.removeEventListener("hashchange", handleHashChange);
      if (ownedSlot?.isConnected) ownedSlot.remove();
    };
  }, []);

  if (!portalTarget) return null;

  return createPortal(
    <section
        className="explorer-block-system-home"
        aria-label="3D Explorer Block System"
        data-testid="rui-nav-02-block-system"
      >
        <div className="explorer-block-system-heading">
          <span>BLOCK SYSTEM</span>
          <strong>Geographic evidence blocks</strong>
          <small>Canonical launch point for verified/materialized block tools. Planned cells remain fail-closed.</small>
        </div>
        <BlockDetailsWorkspace />
        <div className="explorer-block-system-launchers">
          <Phase35MainBlockEngine />
          <Phase3ArabianAtlas />
        </div>
      </section>,
    portalTarget
  );
}
