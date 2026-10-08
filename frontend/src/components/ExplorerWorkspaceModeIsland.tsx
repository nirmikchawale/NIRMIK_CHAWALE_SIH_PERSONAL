import { MprIcon } from "./MprIcon";

/**
 * MPR-04: mode controls are one canonical, independent island, preceding the
 * 3D Explorer feature directory. This component delegates every action to the
 * existing App state handlers: it never owns scientific state or route changes.
 */
type WorkspaceMode = "explorer" | "analysis" | "presentation";

interface Props {
  workspaceMode: WorkspaceMode;
  focusMode: boolean;
  onWorkspaceModeChange: (mode: WorkspaceMode) => void;
  onFocus3D: () => void;
}

export function ExplorerWorkspaceModeIsland({
  workspaceMode,
  focusMode,
  onWorkspaceModeChange,
  onFocus3D
}: Props) {
  if (focusMode) return null;

  return (
    <section
      className="mpr-workspace-mode-island"
      aria-label="Workspace Mode"
      data-testid="mpr-04-workspace-mode-island"
      data-active-mode={workspaceMode}
    >
      <div className="mpr-workspace-mode-heading">
        <span className="mpr-workspace-mode-kicker"><MprIcon name="workspace" size={15}/> WORKSPACE MODE</span>
        <strong>Choose your viewing layout</strong>
        <small>Change your workspace without changing ocean measurements or source selection.</small>
      </div>

      <div className="workspace-mode-switcher explorer-workspace-mode-switcher mpr-workspace-mode-actions"
        role="group" aria-label="Explorer workspace mode">
        <button type="button" className={workspaceMode === "explorer" ? "active" : ""}
          aria-pressed={workspaceMode === "explorer"} aria-label="Explorer workspace"
          onClick={() => onWorkspaceModeChange("explorer")}>
          <MprIcon name="globe" size={18}/><span>Explorer</span>
        </button>
        <button type="button" className={workspaceMode === "analysis" ? "active" : ""}
          aria-pressed={workspaceMode === "analysis"} aria-label="Analysis Split workspace"
          onClick={() => onWorkspaceModeChange("analysis")}>
          <MprIcon name="analyze" size={18}/><span>Analysis Split</span>
        </button>
        <button type="button" className={workspaceMode === "presentation" ? "active" : ""}
          aria-pressed={workspaceMode === "presentation"} aria-label="Presentation workspace"
          onClick={() => onWorkspaceModeChange("presentation")}>
          <MprIcon name="expand" size={18}/><span>Presentation</span>
        </button>
      </div>

      <button type="button" className="explorer-focus-button mpr-focus-3d-action"
        aria-label="Focus 3D" onClick={onFocus3D}>
        <MprIcon name="focus" size={18}/><span>Focus 3D</span>
      </button>
    </section>
  );
}
