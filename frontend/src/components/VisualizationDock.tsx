import type { VisualizationMode } from "../types";
import { SmartDualViewNavigator } from "./SmartDualViewNavigator";

interface Props {
  mode: VisualizationMode;
  waterColumnAvailable: boolean;
  surfaceOnly: boolean;
  variableLabel: string;
  depthM: number;
  timeLabel: string;
  regionLabel: string;
  modelLabel: string;
  observationLabel: string;
  onChange: (mode: VisualizationMode) => void;
}

function compactUtc(value: string): string {
  return value.replace("T", " ").replace("Z", " UTC");
}

export function VisualizationDock({
  mode,
  waterColumnAvailable,
  surfaceOnly,
  variableLabel,
  depthM,
  timeLabel,
  regionLabel,
  modelLabel,
  observationLabel,
  onChange
}: Props) {
  return (
    <section
      className="visualization-dock"
      aria-label="Scientific context and dual 3D visualization modes"
      data-visualization-mode={mode}
    >
      <div className="visualization-dock-copy">
        <span>DUAL 3D VISUALIZATION</span>
        <strong>Move from ocean geography into the verified water column</strong>
        <small>{
          surfaceOnly
            ? `${variableLabel} · satellite surface field · no depth axis`
            : `${variableLabel} · ${depthM.toFixed(2)} m · depth positive down`
        }</small>
      </div>

      <SmartDualViewNavigator
        mode={mode}
        waterColumnAvailable={waterColumnAvailable}
        onChange={onChange}
      />

      <div className="visualization-context-row" aria-label="Current scientific context">
        <div>
          <span>UTC TIME</span>
          <strong>{compactUtc(timeLabel)}</strong>
        </div>
        <div>
          <span>REGION</span>
          <strong title={regionLabel}>{regionLabel}</strong>
        </div>
        <div>
          <span>MODEL / PRODUCT</span>
          <strong title={modelLabel}>{modelLabel}</strong>
        </div>
        <div>
          <span>OBSERVATION</span>
          <strong title={observationLabel}>{observationLabel}</strong>
        </div>
      </div>
    </section>
  );
}
