import type { Catalog, ColorPalette, ColorScaleMode, ProfileSummary, VariableCard } from "../types";
import { displayUnits } from "../units";
import { paletteCssGradient } from "../palettes";

type Variable = VariableCard["id"];

interface Props {
  catalog: Catalog;
  variable: Variable;
  depthIndex: number;
  timeIndex: number;
  profiles: ProfileSummary[];
  selectedProfileId: string;
  opacity: number;
  verticalExaggeration: number;
  isoSurfaceEnabled: boolean;
  isoValue: number;
  palette: ColorPalette;
  scale: ColorScaleMode;
  minimum: number;
  maximum: number;
  loading: boolean;
  error: string;
  onVariableChange: (next: Variable) => void;
  onDepthChange: (next: number) => void;
  onTimeChange: (next: number) => void;
  onProfileChange: (next: string) => void;
  onOpacityChange: (next: number) => void;
  onVerticalExaggerationChange: (next: number) => void;
  onIsoSurfaceEnabledChange: (next: boolean) => void;
  onIsoValueChange: (next: number) => void;
  onPaletteChange: (next: ColorPalette) => void;
  onScaleChange: (next: ColorScaleMode) => void;
  onMinimumChange: (next: number) => void;
  onMaximumChange: (next: number) => void;
  onSourceEvidence: () => void;
  onGeographicView: () => void;
}

/**
 * Only presentation and native React state callbacks. No independent volume,
 * fabricated timestamp/depth, copied renderer camera, or second science store.
 */
export function WaterColumnControlDock({
  catalog, variable, depthIndex, timeIndex, profiles, selectedProfileId,
  opacity, verticalExaggeration, isoSurfaceEnabled, isoValue, palette,
  scale, minimum, maximum, loading, error,
  onVariableChange, onDepthChange, onTimeChange, onProfileChange,
  onOpacityChange, onVerticalExaggerationChange, onIsoSurfaceEnabledChange,
  onIsoValueChange, onPaletteChange, onScaleChange, onMinimumChange,
  onMaximumChange, onSourceEvidence, onGeographicView
}: Props) {
  const active = catalog.variables.find(item => item.id === variable);
  const depths = catalog.coordinates.depth;
  const timestamps = catalog.coordinates.time;
  const depth = depths[depthIndex];
  const time = timestamps[timeIndex] ?? "Native timestamp unavailable";
  const surfaceOnly = catalog.capabilities.surface_only === true;
  const numericMinimum = active?.minimum ?? 0;
  const numericMaximum = active?.maximum ?? 1;
  const step = Math.max((numericMaximum - numericMinimum) / 200, 0.000001);
  const scalar = active?.kind === "scalar" && !surfaceOnly;
  const logEligible = numericMinimum > 0 && minimum > 0 && maximum > 0;
  const sourceVariable = active?.label ?? variable;
  const available = !surfaceOnly && depths.length > 0 &&
    catalog.variables.some(item => item.id === variable);
  const jumpToRendererControl = (selector: string) => {
    const node = document.querySelector<HTMLElement>(
      "#mpr-water-column-section " + selector
    );
    if (!node) return;
    node.scrollIntoView({ block: "nearest", behavior: "auto" });
    node.querySelector<HTMLElement>("button,[tabindex]")?.focus({ preventScroll: true });
  };

  return (
    <aside className="mpr-water-column-dock mpr-water-column-controls"
      data-testid="mpr-12-water-column-dock"
      data-mpr-phase="13"
      aria-label="Water Column 3D scientific tools"
      data-native-timestamp={time}
      data-source-variable={variable}>
      <header className="mpr-water-column-dock-heading" data-testid="mpr-13-water-column-controls">
        <span>WATER COLUMN · GENUINE SCIENTIFIC CONTROLS</span>
        <strong>Water Column 3D</strong>
        <small>{loading ? "Loading native scientific evidence…" :
          error ? "Source degraded · inspect evidence" :
            "Linked to Geographic 3D: same source, native time, variable and depth"}</small>
      </header>
      <dl className="mpr-water-column-native-context" aria-label="Water-column source and selected native coordinates">
        <div><dt>Product</dt><dd>{catalog.dataset.product}</dd></div>
        <div><dt>Variable</dt><dd>{sourceVariable}</dd></div>
        <div><dt>Native time</dt><dd>{time}</dd></div>
        <div><dt>Native depth</dt><dd>{surfaceOnly ? "Surface only" : depth == null ? "Unavailable" : depth.toFixed(2) + " m ↓"}</dd></div>
      </dl>
      <details className="mpr-water-control-group" open>
        <summary>Variable and genuine model depth</summary>
        <div className="mpr-water-group-content">
          <label>Water column variable
            <select aria-label="Water column variable" value={variable}
              onChange={event => onVariableChange(event.target.value as Variable)}>
              {catalog.variables.map(item =>
                <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label>Source-native depth level
            <select aria-label="Water Column native depth level"
              disabled={!available} value={available ? depthIndex : ""}
              onChange={event => onDepthChange(Number(event.target.value))}>
              {!available && <option value="">No subsurface levels</option>}
              {available && depths.map((depthM, index) =>
                <option key={index} value={index}>{depthM.toFixed(2)} m ↓</option>)}
            </select>
          </label>
          <small>Depth values remain positive down, as recorded by the scientific source.</small>
        </div>
      </details>
      <details className="mpr-water-control-group" open>
        <summary>Native time and observation</summary>
        <div className="mpr-water-group-content">
          <label>Verified time selection
            <select aria-label="Water Column native timestamp"
              value={timestamps.length ? timeIndex : ""}
              disabled={timestamps.length <= 1}
              onChange={event => onTimeChange(Number(event.target.value))}>
              {timestamps.length===0 && <option value="">No verified time</option>}
              {timestamps.map((stamp,index)=>
                <option key={stamp+"-"+index} value={index}>{stamp}</option>)}
            </select>
          </label>
          <small>{timestamps.length <= 1
            ? "One genuine time step; no synthetic playback."
            : timestamps.length + " native timestamps supplied by selected source."}</small>
          <label>Verified Argo comparison
            <select aria-label="Water Column observation profile"
              value={profiles.some(x=>x.profile_id===selectedProfileId) ? selectedProfileId : ""}
              disabled={profiles.length === 0}
              onChange={event => onProfileChange(event.target.value)}>
              <option value="">No profile selected</option>
              {profiles.map(p=><option key={p.profile_id} value={p.profile_id}>
                {p.platform_id} · cycle {p.cycle} {p.direction}
              </option>)}
            </select>
          </label>
          {profiles.length===0 &&
            <small>No verified comparison profile is available for this active source.</small>}
        </div>
      </details>
      <details className="mpr-water-control-group" open>
        <summary>Point opacity and vertical geometry</summary>
        <div className="mpr-water-group-content">
          <label>Point opacity: {opacity}%
            <input aria-label="Water Column point opacity" type="range"
              min={15} max={95} step={1} value={opacity} disabled={!available}
              onChange={event => onOpacityChange(Number(event.target.value))}/>
          </label>
          <label>Vertical exaggeration: ×{verticalExaggeration}
            <input aria-label="Water Column vertical exaggeration" type="range"
              min={1} max={100} step={1} value={verticalExaggeration} disabled={!available}
              onChange={event=>onVerticalExaggerationChange(Number(event.target.value))}/>
          </label>
          <small>Only display geometry changes; native depths and measured values do not.</small>
        </div>
      </details>
      <details className="mpr-water-control-group" open>
        <summary>Scientific colour and display threshold</summary>
        <div className="mpr-water-group-content">
          <label>Colour palette
            <select aria-label="Water Column colour palette" value={palette}
              onChange={event=>onPaletteChange(event.target.value as ColorPalette)}>
              <option value="thermal">Thermal</option>
              <option value="viridis">Viridis</option>
              <option value="icefire">Icefire</option>
            </select>
          </label>
          <div className="mpr-water-colour-ramp"
            role="img" aria-label={palette+" scientific colour palette"}
            style={{background:paletteCssGradient(palette)}}/>
          <label>Numeric scale
            <select aria-label="Water Column numeric colour scale" value={scale}
              onChange={event=>onScaleChange(event.target.value as ColorScaleMode)}>
              <option value="linear">Linear</option>
              <option value="log" disabled={!logEligible}>Logarithmic (positive only)</option>
            </select>
          </label>
          <div className="mpr-water-range-inputs">
            <label>Display minimum ({displayUnits(active?.units ?? "")})
              <input aria-label="Water Column display minimum" type="number"
                min={numericMinimum} max={maximum} step={step}
                value={minimum} onChange={event=>{
                  const next=Number(event.target.value);
                  if(Number.isFinite(next)) onMinimumChange(Math.max(numericMinimum,Math.min(next,maximum-step)));
                }}/>
            </label>
            <label>Display maximum ({displayUnits(active?.units ?? "")})
              <input aria-label="Water Column display maximum" type="number"
                min={minimum} max={numericMaximum} step={step}
                value={maximum} onChange={event=>{
                  const next=Number(event.target.value);
                  if(Number.isFinite(next)) onMaximumChange(Math.min(numericMaximum,Math.max(next,minimum+step)));
                }}/>
            </label>
          </div>
          <small>Same palette and numeric thresholds as the Geographic legend; no change to raw observations.</small>
        </div>
      </details>
      <details className="mpr-water-control-group">
        <summary>Native isosurface and horizontal currents</summary>
        <div className="mpr-water-group-content">
          <label className="mpr-water-toggle">
            <input aria-label="Water Column isosurface" type="checkbox"
              checked={isoSurfaceEnabled} disabled={!scalar}
              onChange={event=>onIsoSurfaceEnabledChange(event.target.checked)}/>
            Show model-sourced scalar isosurface
          </label>
          {scalar && <label>Isosurface value ({displayUnits(active?.units ?? "")})
            <input aria-label="Water Column isosurface value" type="number"
              min={numericMinimum} max={numericMaximum} step={step}
              value={isoValue} disabled={!isoSurfaceEnabled}
              onChange={event=>{
                const value=Number(event.target.value);
                if(Number.isFinite(value)) onIsoValueChange(Math.min(numericMaximum,Math.max(numericMinimum,value)));
              }}/>
          </label>}
          <small>{variable==="currents"
            ? "Only genuine horizontal u/v are drawn at their source depths; no vertical w component is inferred."
            : "The isosurface is extracted from the original model volume; no additional observations are generated."}</small>
        </div>
      </details>
      <details className="mpr-water-control-group">
        <summary>Camera, provenance and workflow</summary>
        <div className="mpr-water-group-content mpr-water-workflow-actions">
          <button type="button" onClick={()=>jumpToRendererControl(".water-column-smooth-zoom")}>
            Native zoom controls ↗
          </button>
          <button type="button" onClick={()=>jumpToRendererControl(".camera-orientation-hud")}>
            Native 3D camera presets ↗
          </button>
          <button type="button" onClick={onSourceEvidence}>Sources &amp; QC ↗</button>
          <small>Zoom and orbit remain owned by the real WaterColumn3D renderer and its keyboard/canvas controls.</small>
        </div>
      </details>
      <button type="button" className="mpr-water-column-return" aria-label="Return to Geographic 3D"
        onClick={onGeographicView}>Geographic 3D ↗</button>
    </aside>
  );
}
