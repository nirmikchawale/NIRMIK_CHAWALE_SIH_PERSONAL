type WorkspaceMode = "explorer" | "analysis" | "presentation";

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

interface Props {
  workspaceMode: WorkspaceMode;
  focusMode: boolean;
  onWorkspaceModeChange: (mode: WorkspaceMode) => void;
  onFocus3D: () => void;
}

const DIRECTORIES: Array<{ id: ExplorerDirectoryId; label: string; target: string }> = [
  { id: "overview", label: "Overview", target: ".evidence-status-pill, .evidence-rail" },
  { id: "workspace", label: "Workspace", target: ".visualization-dock" },
  { id: "block-system", label: "Block System", target: "[data-testid='rui-nav-02-block-system']" },
  { id: "scene-controls", label: "Scene Controls", target: ".renderer-tools" },
  { id: "variables", label: "Variables", target: "#explore-variables" },
  { id: "display-range", label: "Display Range", target: ".scientific-colorbar-hud" },
  { id: "depth-section", label: "Depth & Section", target: "#explore-depth" },
  { id: "time", label: "Time", target: "#explore-time" },
  { id: "observations", label: "Observations", target: "#explore-observations" },
  { id: "render-quality", label: "Render Quality", target: ".imagery-control" },
  { id: "context-info", label: "Context & Info", target: ".source-workbench" }
];

function revealDirectory(target: string) {
  const element = document.querySelector(target);
  if (!(element instanceof HTMLElement)) return;
  element.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

export function ExplorerDirectoryNav({
  workspaceMode,
  focusMode,
  onWorkspaceModeChange,
  onFocus3D
}: Props) {
  return (
    <section
      className="explorer-directory-shell"
      aria-label="3D Explorer directories"
      data-testid="rui-nav-02-explorer-directory"
    >
      <div className="explorer-directory-title">
        <span>3D EXPLORER</span>
        <strong>Feature directory</strong>
        <small>One canonical home per Explorer capability</small>
      </div>

      <nav className="explorer-directory-nav" aria-label="3D Explorer feature directory">
        {DIRECTORIES.map((directory) => (
          <button
            key={directory.id}
            type="button"
            data-explorer-directory={directory.id}
            onClick={() => revealDirectory(directory.target)}
          >
            {directory.label}
          </button>
        ))}
      </nav>

      <div className="explorer-directory-workspace" aria-label="Explorer workspace layout">
        <span>WORKSPACE</span>
        <div className="workspace-mode-switcher explorer-workspace-mode-switcher" role="group" aria-label="Explorer workspace mode">
          <button
            type="button"
            className={workspaceMode === "explorer" ? "active" : ""}
            aria-pressed={workspaceMode === "explorer"}
            aria-label="Explorer workspace"
            onClick={() => onWorkspaceModeChange("explorer")}
          >
            Explorer
          </button>
          <button
            type="button"
            className={workspaceMode === "analysis" ? "active" : ""}
            aria-pressed={workspaceMode === "analysis"}
            aria-label="Analysis Split workspace"
            onClick={() => onWorkspaceModeChange("analysis")}
          >
            Analysis Split
          </button>
          <button
            type="button"
            className={workspaceMode === "presentation" ? "active" : ""}
            aria-pressed={workspaceMode === "presentation"}
            aria-label="Presentation workspace"
            onClick={() => onWorkspaceModeChange("presentation")}
          >
            Presentation
          </button>
        </div>
        {!focusMode && (
          <button type="button" className="explorer-focus-button" aria-label="Focus 3D" onClick={onFocus3D}>
            Focus 3D
          </button>
        )}
      </div>
    </section>
  );
}
