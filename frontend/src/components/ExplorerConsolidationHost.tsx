import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { ExplorerDirectoryNav } from "./ExplorerDirectoryNav";
import { Phase35MainBlockEngine } from "./Phase35MainBlockEngine";
import { Phase3ArabianAtlas } from "./Phase3ArabianAtlas";

type WorkspaceMode = "explorer" | "analysis" | "presentation";

const WORKSPACE_LABEL: Record<WorkspaceMode, string> = {
  explorer: "Explorer workspace",
  analysis: "Analysis Split workspace",
  presentation: "Presentation workspace"
};

function readWorkspaceMode(workbench?: HTMLElement | null): WorkspaceMode {
  const mode = workbench?.dataset.workspaceMode;
  return mode === "analysis" || mode === "presentation" ? mode : "explorer";
}

function readFocusMode(workbench?: HTMLElement | null): boolean {
  return workbench?.classList.contains("focus-mode") ?? false;
}

export function ExplorerConsolidationHost() {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("explorer");
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    let disposed = false;
    let frameId = 0;
    let attemptsRemaining = 0;
    let ownedSlot: HTMLElement | null = null;
    let observedWorkbench: HTMLElement | null = null;
    let workbenchObserver: MutationObserver | null = null;

    const syncPresentation = () => {
      const workbench = observedWorkbench ?? document.querySelector<HTMLElement>(".ocean-workbench");
      const nextWorkspaceMode = readWorkspaceMode(workbench);
      const nextFocusMode = readFocusMode(workbench);
      setWorkspaceMode((current) => current === nextWorkspaceMode ? current : nextWorkspaceMode);
      setFocusMode((current) => current === nextFocusMode ? current : nextFocusMode);
    };

    const bindWorkbench = () => {
      const nextWorkbench = document.querySelector<HTMLElement>(".ocean-workbench");
      if (nextWorkbench === observedWorkbench) return;

      workbenchObserver?.disconnect();
      workbenchObserver = null;
      observedWorkbench = nextWorkbench;

      if (observedWorkbench) {
        workbenchObserver = new MutationObserver(() => {
          syncPresentation();
          if (observedWorkbench?.dataset.page === "explore") scheduleAttachment(30);
          else setPortalTarget((current) => current === null ? current : null);
        });
        workbenchObserver.observe(observedWorkbench, {
          attributes: true,
          attributeFilter: ["class", "data-workspace-mode", "data-page"]
        });
      }
      syncPresentation();
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

  const activateWorkspace = (mode: WorkspaceMode) => {
    const control = document.querySelector<HTMLButtonElement>(
      `.app-header .workspace-mode-switcher button[aria-label="${WORKSPACE_LABEL[mode]}"]`
    );
    control?.click();
  };

  const focus3D = () => {
    document.querySelector<HTMLButtonElement>('.app-header button[aria-label="Focus 3D"]')?.click();
  };

  if (!portalTarget) return null;

  return createPortal(
    <>
      <ExplorerDirectoryNav
        workspaceMode={workspaceMode}
        focusMode={focusMode}
        onWorkspaceModeChange={activateWorkspace}
        onFocus3D={focus3D}
      />

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
        <div className="explorer-block-system-launchers">
          <Phase35MainBlockEngine />
          <Phase3ArabianAtlas />
        </div>
      </section>
    </>,
    portalTarget
  );
}
