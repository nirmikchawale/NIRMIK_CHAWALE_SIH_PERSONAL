import { useState } from "react";
import { MprIcon, type MprIconName } from "./MprIcon";

type ExplorerDirectoryId =
  | "overview"
  | "workspace"
  | "block-system"
  | "scene-controls"
  | "variables"
  | "display-range"
  | "depth-section"
  | "time"
  | "observations"
  | "render-quality"
  | "context-info";

/**
 * MPR-05 preserves all 11 canonical Explorer destinations. Relocation of
 * the destinations inside the two future 3D control docks belongs to MPR-10+
 * and must only update these selectors after the actual controls are mounted.
 */
const DIRECTORIES: ReadonlyArray<{
  id: ExplorerDirectoryId;
  label: string;
  icon: MprIconName;
  target: string;
}> = [
  { id: "overview", label: "Overview", icon: "explore", target: ".evidence-status-pill, .evidence-rail" },
  { id: "workspace", label: "Workspace", icon: "workspace", target: ".visualization-dock" },
  { id: "block-system", label: "Block System", icon: "block", target: "[data-testid='rui-nav-02-block-system']" },
  { id: "scene-controls", label: "Scene Controls", icon: "settings", target: ".renderer-tools" },
  { id: "variables", label: "Variables", icon: "variable", target: "#explore-variables" },
  { id: "display-range", label: "Display Range", icon: "palette", target: ".scientific-colorbar-hud" },
  { id: "depth-section", label: "Depth & Section", icon: "depth", target: "#explore-depth" },
  { id: "time", label: "Time", icon: "time", target: "#explore-time" },
  { id: "observations", label: "Observations", icon: "observations", target: "#explore-observations" },
  { id: "render-quality", label: "Render Quality", icon: "render", target: ".imagery-control" },
  { id: "context-info", label: "Context & Info", icon: "source", target: ".source-workbench" }
];

function revealDirectory(target: string, label: string, announce: (message: string) => void) {
  // Multiple potential homes are deliberate: active EvidenceRail and compact
  // Overview entry depend on current mode. Never scroll to hidden/stale views.
  const element = Array.from(document.querySelectorAll<HTMLElement>(target)).find(node => {
    const style = window.getComputedStyle(node);
    return node.getClientRects().length > 0 &&
      style.visibility !== "hidden" && style.display !== "none";
  });
  if (!element) {
    announce(`${label} is not available in this view.`);
    return;
  }
  announce("");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({
    block: "nearest",
    inline: "nearest",
    behavior: reducedMotion ? "auto" : "smooth"
  });
}

export function ExplorerDirectoryNav() {
  const [announcement, setAnnouncement] = useState("");

  return (
    <section
      className="explorer-directory-shell"
      aria-label="3D Explorer directories"
      data-testid="rui-nav-02-explorer-directory"
    >
      <div className="explorer-directory-title">
        <span className="mpr-directory-kicker">
          <MprIcon name="globe" size={16} /> 3D EXPLORER
        </span>
        <strong>Feature directory</strong>
        <small>One canonical home per Explorer capability</small>
      </div>

      <nav
        className="explorer-directory-nav"
        aria-label="3D Explorer feature directory"
        onKeyDown={(event) => {
          if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
          if (!(event.target instanceof HTMLButtonElement)) return;
          const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(
            "button[data-explorer-directory]"
          ));
          const current = buttons.indexOf(event.target);
          if (current < 0) return;
          event.preventDefault();
          const target = event.key === "Home" ? 0 :
            event.key === "End" ? buttons.length - 1 :
              event.key === "ArrowRight" ? Math.min(buttons.length - 1, current + 1) :
                Math.max(0, current - 1);
          const button = buttons[target];
          button?.focus();
          button?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
        }}
      >
        {DIRECTORIES.map(directory => (
          <button
            key={directory.id}
            type="button"
            data-explorer-directory={directory.id}
            onClick={() => revealDirectory(directory.target, directory.label, setAnnouncement)}
          >
            <MprIcon name={directory.icon} size={17} />
            <span>{directory.label}</span>
          </button>
        ))}
      </nav>
      <span className="mpr-directory-announcement" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </section>
  );
}
