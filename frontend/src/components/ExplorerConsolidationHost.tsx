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

function readWorkspaceMode(): WorkspaceMode {
  const mode = document.querySelector<HTMLElement>(".ocean-workbench")?.dataset.workspaceMode;
  return mode === "analysis" || mode === "presentation" ? mode : "explorer";
}

function readFocusMode(): boolean {
  return document.querySelector(".ocean-workbench")?.classList.contains("focus-mode") ?? false;
}

export function ExplorerConsolidationHost() {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(readWorkspaceMode);
  const [focusMode, setFocusMode] = useState(readFocusMode);

  useEffect(() => {
    let ownedSlot: HTMLElement | null = null;

    const sync = () => {
      const workbench = document.querySelector<HTMLElement>(".ocean-workbench");
      const workspace = document.querySelector<HTMLElement>(".station-workspace");

      setWorkspaceMode(readWorkspaceMode());
      setFocusMode(readFocusMode());

      if (!workspace) {
        setPortalTarget(null);
        return;
      }

      let slot = workspace.querySelector<HTMLElement>(":scope > [data-rui-nav-02-slot]");
      if (!slot) {
        slot = document.createElement("div");
        slot.className = "explorer-consolidation-slot";
        slot.dataset.ruiNav02Slot = "true";
        workspace.prepend(slot);
        ownedSlot = slot;
      }
      setPortalTarget((current) => current === slot ? current : slot);

      if (workbench) {
        setWorkspaceMode(readWorkspaceMode());
        setFocusMode(readFocusMode());
      }
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "data-workspace-mode", "data-page"]
    });
    window.addEventListener("hashchange", sync);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", sync);
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
