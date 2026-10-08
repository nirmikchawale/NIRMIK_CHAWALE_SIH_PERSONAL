import type { VisualizationMode } from "../types";
import { MprIcon } from "./MprIcon";

interface Props {
  mode: VisualizationMode;
  waterColumnAvailable: boolean;
  onChange: (mode: VisualizationMode) => void;
}

/**
 * MPR-09: the canonical, science-safe dual-view navigator. The current MVP
 * navigates between two independently mounted, source-backed renderers.
 * Selection stays in the canonical view mode, not an alternate dataset.
 */
export function SmartDualViewNavigator({ mode, waterColumnAvailable, onChange }: Props) {
  const moveToView = (target: VisualizationMode) => {
    if (target === "water-column" && !waterColumnAvailable) return;
    onChange(target);
    // App handles scrolling to the REAL Geographic or Water Column section.
  };

  return (
    <div className="visualization-dock-modes mpr-dual-view-navigator"
      role="group"
      aria-label="Smart Dual-View Navigator"
      data-testid="mpr-09-dual-view-navigator"
      data-active-view={mode}>
      <button type="button"
        className={mode === "globe" ? "active" : ""}
        aria-pressed={mode === "globe"}
        aria-label="Geographic View"
        aria-controls="mpr-3d-stage"
        onClick={() => moveToView("globe")}>
        <span className="mode-number">VIEW 1</span>
        <span className="mode-icon"><MprIcon name="globe" size={21}/></span>
        <span className="mode-label">
          <strong>Geographic View</strong>
          <small>Geographic 3D · Earth and region</small>
        </span>
      </button>
      <button type="button"
        className={mode === "water-column" ? "active" : ""}
        aria-pressed={mode === "water-column"}
        aria-label="Water Column 3D"
        aria-controls="mpr-water-column-section"
        disabled={!waterColumnAvailable}
        title={waterColumnAvailable ? "Open actual water-column 3D" : "Water-column 3D unavailable for this source"}
        onClick={() => moveToView("water-column")}>
        <span className="mode-number">VIEW 2</span>
        <span className="mode-icon"><MprIcon name="water-column" size={21}/></span>
        <span className="mode-label">
          <strong>Water Column 3D</strong>
          <small>{waterColumnAvailable ? "Actual lon · lat · positive-down depth" : "Unavailable for selected source"}</small>
        </span>
      </button>
    </div>
  );
}
