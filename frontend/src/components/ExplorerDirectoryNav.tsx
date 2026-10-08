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

export function ExplorerDirectoryNav() {
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


    </section>
  );
}
