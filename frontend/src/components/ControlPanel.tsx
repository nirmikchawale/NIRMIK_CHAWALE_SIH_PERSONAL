import { useEffect, useRef } from "react";

import type { Catalog, ProfileSummary, ViewMode, VisualizationMode } from "../types";
import { displayUnits } from "../units";
import { TimelineScrubber } from "./TimelineScrubber";
import { publishScientificWorkspaceContext, readScientificWorkspaceContext } from "../scientific-context-runtime";

const DEPTH_TRACK_MAX = 1000;
const EPipelagic_END_M = 200;
const MESOPELAGIC_END_M = 1000;
const DEEP_REFERENCE_M = 4000;

function depthToTrackPosition(depthM: number, deepestVerifiedM: number) {
  if (depthM <= EPipelagic_END_M) {
    return (Math.max(0, depthM) / EPipelagic_END_M) * 400;
  }
  if (depthM <= MESOPELAGIC_END_M) {
    return 400 + ((depthM - EPipelagic_END_M) / (MESOPELAGIC_END_M - EPipelagic_END_M)) * 350;
  }
  const deepExtent = Math.max(DEEP_REFERENCE_M, deepestVerifiedM);
  return 750 + ((Math.min(depthM, deepExtent) - MESOPELAGIC_END_M) / (deepExtent - MESOPELAGIC_END_M)) * 250;
}

function trackPositionToDepth(trackPosition: number, deepestVerifiedM: number) {
  const position = Math.min(DEPTH_TRACK_MAX, Math.max(0, trackPosition));
  if (position <= 400) {
    return (position / 400) * EPipelagic_END_M;
  }
  if (position <= 750) {
    return EPipelagic_END_M + ((position - 400) / 350) * (MESOPELAGIC_END_M - EPipelagic_END_M);
  }
  const deepExtent = Math.max(DEEP_REFERENCE_M, deepestVerifiedM);
  return MESOPELAGIC_END_M + ((position - 750) / 250) * (deepExtent - MESOPELAGIC_END_M);
}

function nearestDepthIndex(depths: number[], targetDepthM: number) {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  depths.forEach((depthM, index) => {
    const distance = Math.abs(depthM - targetDepthM);
    if (distance < bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }
  });
  return bestIndex;
}

function depthZone(depthM: number) {
  if (depthM <= EPipelagic_END_M) return "Epipelagic";
  if (depthM <= MESOPELAGIC_END_M) return "Mesopelagic";
  return "Bathypelagic";
}

interface Props {
  catalog: Catalog;
  profiles: ProfileSummary[];
  sourceMode: "glorys" | "incois" | "chlorophyll";
  variable: "thetao" | "so" | "currents" | "chlorophyll";
  viewMode: ViewMode;
  visualizationMode: VisualizationMode;
  waterColumnOpacity: number;
  depthIndex: number;
  timeIndex: number;
  verticalExaggeration: number;
  selectedProfileId: string;
  playing: boolean;
  playbackSpeed: number;
  timelineObservations: Array<{ timestamp: string; label: string }>;
  isoSurfaceEnabled: boolean;
  isoValue: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onVariableChange: (value: "thetao" | "so" | "currents" | "chlorophyll") => void;
  onViewModeChange: (value: ViewMode) => void;
  onWaterColumnOpacityChange: (value: number) => void;
  onDepthChange: (value: number) => void;
  onTimeChange: (value: number) => void;
  onVerticalExaggerationChange: (value: number) => void;
  onProfileChange: (value: string) => void;
  onPlayingChange: (value: boolean) => void;
  onPlaybackSpeedChange: (value: number) => void;
  onIsoSurfaceEnabledChange: (value: boolean) => void;
  onIsoValueChange: (value: number) => void;
}

export function ControlPanel({
  catalog,
  profiles,
  sourceMode,
  variable,
  viewMode,
  visualizationMode,
  waterColumnOpacity,
  depthIndex,
  timeIndex,
  verticalExaggeration,
  selectedProfileId,
  playing,
  playbackSpeed,
  timelineObservations,
  isoSurfaceEnabled,
  isoValue,
  mobileOpen,
  onMobileClose,
  onVariableChange,
  onViewModeChange,
  onWaterColumnOpacityChange,
  onDepthChange,
  onTimeChange,
  onVerticalExaggerationChange,
  onProfileChange,
  onPlayingChange,
  onPlaybackSpeedChange,
  onIsoSurfaceEnabledChange,
  onIsoValueChange
}: Props) {
  const depths = catalog.coordinates.depth;
  const depth = depths[depthIndex] ?? 0;
  const deepestVerifiedDepth = Math.max(...depths, 0);
  const depthTrackPosition = depthToTrackPosition(depth, deepestVerifiedDepth);
  const time = catalog.coordinates.time[timeIndex] ?? "Unavailable";
  const scalar = variable !== "currents";
  const surfaceOnly = catalog.capabilities.surface_only === true;
  const currentDepthZone = depthZone(depth);
  const selectedVariable = catalog.variables.find((item) => item.id === variable);
  const initialContextHydrated = useRef(false);

  useEffect(() => {
    if (!initialContextHydrated.current) {
      const requested = readScientificWorkspaceContext();

      // Source hydration is owned by SourceWorkbench because INCOIS/chlorophyll
      // availability is asynchronous. Do not publish GLORYS defaults while that
      // source handoff is still pending.
      if (requested.sourceMode !== sourceMode) return;

      let changed = false;
      const requestedVariable = catalog.variables.find((item) => item.id === requested.variable);
      if (requestedVariable && requested.variable !== variable) {
        onVariableChange(requested.variable);
        changed = true;
      }

      if (!surfaceOnly && requested.depthM != null && depths.length > 0) {
        const requestedDepthIndex = nearestDepthIndex(depths, requested.depthM);
        if (requestedDepthIndex !== depthIndex) {
          onDepthChange(requestedDepthIndex);
          changed = true;
        }
      }

      if (requested.timestamp) {
        const requestedTimeIndex = catalog.coordinates.time.findIndex((timestamp) => timestamp === requested.timestamp);
        if (requestedTimeIndex >= 0 && requestedTimeIndex !== timeIndex) {
          onTimeChange(requestedTimeIndex);
          changed = true;
        }
      }

      if (
        requested.selectedProfileId &&
        requested.selectedProfileId !== selectedProfileId &&
        profiles.some((profile) => profile.profile_id === requested.selectedProfileId)
      ) {
        onProfileChange(requested.selectedProfileId);
        changed = true;
      }

      initialContextHydrated.current = true;
      if (changed) return;
    }

    const timestamp = catalog.coordinates.time[timeIndex] ?? null;
    publishScientificWorkspaceContext({
      sourceMode,
      variable,
      depthIndex: surfaceOnly ? null : depthIndex,
      depthM: surfaceOnly ? null : depth,
      timestamp,
      timeIndex: timestamp ? timeIndex : null,
      timeKind: timestamp ? "native" : "unavailable",
      selectedProfileId: selectedProfileId || null,
      origin: "explorer"
    });
  }, [
    catalog,
    depth,
    depthIndex,
    depths,
    onDepthChange,
    onProfileChange,
    onTimeChange,
    onVariableChange,
    profiles,
    selectedProfileId,
    sourceMode,
    surfaceOnly,
    timeIndex,
    variable
  ]);

  const selectDepthFromTrack = (trackPosition: number) => {
    const physicalDepth = trackPositionToDepth(trackPosition, deepestVerifiedDepth);
    onDepthChange(nearestDepthIndex(depths, physicalDepth));
  };

  const selectDepthZone = (minimumM: number, maximumM: number, targetM: number) => {
    const candidates = depths
      .map((depthM, index) => ({ depthM, index }))
      .filter(({ depthM }) => depthM >= minimumM && depthM <= maximumM);
    if (candidates.length === 0) return;
    const nearest = candidates.reduce((best, candidate) =>
      Math.abs(candidate.depthM - targetM) < Math.abs(best.depthM - targetM) ? candidate : best
    );
    onDepthChange(nearest.index);
  };

  const zoneAvailability = {
    epipelagic: depths.some((value) => value >= 0 && value <= EPipelagic_END_M),
    mesopelagic: depths.some((value) => value > EPipelagic_END_M && value <= MESOPELAGIC_END_M),
    bathypelagic: depths.some((value) => value > MESOPELAGIC_END_M)
  };

  return (
    <aside
      className="control-panel"
      data-mobile-open={mobileOpen ? "true" : "false"}
      aria-label="Scientific explorer controls"
    >
      <div className="mobile-sheet-header">
        <div>
          <span>EXPLORER CONTROLS</span>
          <strong>Layer · depth · time · observations</strong>
        </div>
        <button type="button" onClick={onMobileClose} aria-label="Close explorer controls">
          Close
        </button>
      </div>
      <nav className="control-section-nav" aria-label="Jump to exploration controls">
        {[["Variables", "explore-variables"], ["Depth", "explore-depth"], ["Time", "explore-time"], ["Observations", "explore-observations"]].map(([label, id]) =>
          <button key={id} type="button" onClick={() => document.getElementById(id)?.scrollIntoView({ block: "nearest", behavior: "auto" })}>{label}</button>
        )}
      </nav>
      <section id="explore-variables">
        <div className="section-kicker">Explore</div>
        <div className="variable-switcher variable-switcher-rich" aria-label="Ocean variable">
          {catalog.variables.map((item) => {
            const icon = item.id === "thetao" ? "T°" : item.id === "so" ? "S" : item.id === "currents" ? "↗" : "Chl";
            return (
              <button
                key={item.id}
                className={variable === item.id ? "active" : ""}
                aria-pressed={variable === item.id}
                onClick={() => onVariableChange(item.id as "thetao" | "so" | "currents" | "chlorophyll")}
              >
                <span className="variable-pill-icon" aria-hidden="true">{icon}</span>
                <span className="variable-pill-copy">
                  <strong>{item.label}</strong>
                  <small>{item.minimum.toFixed(2)} – {item.maximum.toFixed(2)} {displayUnits(item.units)}</small>
                </span>
              </button>
            );
          })}
        </div>
        {selectedVariable && (
          <>
            <p className="active-range">
              Verified range{" "}
              <strong>
                {selectedVariable.minimum.toFixed(3)}
                {" – "}
                {selectedVariable.maximum.toFixed(3)}
                {" "}
                {displayUnits(selectedVariable.units)}
              </strong>
            </p>
            <details className="variable-insight-card"><summary>About this variable</summary>
              <span>WHAT YOU ARE READING</span>
              <strong>{selectedVariable.label}</strong>
              <p>
                {variable === "thetao"
                  ? "Trace warm and cool structures across the verified region and follow how the scalar field changes with depth."
                  : variable === "so"
                    ? "Inspect salinity structure and water-mass gradients across the same verified model geometry."
                    : variable === "currents"
                      ? "Read genuine horizontal u/v flow vectors at their scientific depths. No vertical-current component is inferred."
                      : "Inspect genuine satellite chlorophyll at the ocean surface; Water Column 3D is intentionally unavailable for this source."}
              </p>
            </details>
          </>
        )}

        <details className="advanced-control-group">
          <summary>
            <span>View settings</span>
            <small>3D mode · rendering · vertical display</small>
          </summary>
          <div className="advanced-control-body">
            <div className="section-kicker visualization-kicker">Rendering controls · active 3D mode</div>
            <div className="active-3d-mode-card">
              <strong>{visualizationMode === "globe" ? "Geographic View" : "Water Column 3D"}</strong>
              <span>
                {visualizationMode === "globe"
                  ? "Geospatial context with depth-aware scientific overlays."
                  : "Scientific lon/lat/depth box using canonical model volume values."}
              </span>
              <small>Switch views from the persistent visualization dock.</small>
            </div>

            {visualizationMode === "globe" && !surfaceOnly && (
              <div className="segmented field-mode-selector" aria-label="Globe field mode">
                <button
                  className={viewMode === "slice" ? "active" : ""}
                  disabled={!scalar}
                  onClick={() => onViewModeChange("slice")}
                >
                  Depth slice
                </button>
                <button
                  className={viewMode === "volume" ? "active" : ""}
                  disabled={!scalar}
                  onClick={() => onViewModeChange("volume")}
                >
                  3D field
                </button>
              </div>
            )}

            {visualizationMode === "water-column" && (
              <label className="opacity-control">
                <span className="label-row">
                  <span>Point opacity</span>
                  <strong>{waterColumnOpacity}%</strong>
                </span>
                <input
                  type="range"
                  min={15}
                  max={95}
                  value={waterColumnOpacity}
                  onChange={(event) => onWaterColumnOpacityChange(Number(event.target.value))}
                />
              </label>
            )}

            {!surfaceOnly && (
              <label>
                <span className="label-row">
                  <span>Visual vertical exaggeration</span>
                  <strong>{verticalExaggeration}×</strong>
                </span>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={verticalExaggeration}
                  onChange={(event) => onVerticalExaggerationChange(Number(event.target.value))}
                />
              </label>
            )}

            <div className="persistent-colorbar-note">
              <span className="section-kicker visualization-kicker">Display colour</span>
              <strong>Dedicated display range</strong>
              <p className="microcopy">
                Palette, scale and min/max thresholds are available in the Display range section below the ocean view.
              </p>
              {scalar && !surfaceOnly && <label className="iso-toggle">
                <span className="label-row">
                  <span>Isosurface</span>
                  <input
                    type="checkbox"
                    checked={isoSurfaceEnabled}
                    onChange={(event) => onIsoSurfaceEnabledChange(event.target.checked)}
                  />
                </span>
              </label>}
              {scalar && !surfaceOnly && isoSurfaceEnabled && (
                <label>
                  <span className="label-row">
                    <span>Iso value</span>
                    <strong>{isoValue.toFixed(3)} {displayUnits(catalog.variables.find((item) => item.id === variable)?.units)}</strong>
                  </span>
                  <input
                    type="range"
                    min={catalog.variables.find((item) => item.id === variable)?.minimum ?? 0}
                    max={catalog.variables.find((item) => item.id === variable)?.maximum ?? 1}
                    step={Math.max(
                      ((catalog.variables.find((item) => item.id === variable)?.maximum ?? 1) -
                        (catalog.variables.find((item) => item.id === variable)?.minimum ?? 0)) / 200,
                      0.0001
                    )}
                    value={isoValue}
                    onChange={(event) => onIsoValueChange(Number(event.target.value))}
                  />
                </label>
              )}
            </div>

            {surfaceOnly ? (
              <p className="microcopy">
                This INCOIS ocean-colour product is surface-only. Depth, vertical exaggeration and Water Column 3D are intentionally disabled.
              </p>
            ) : !scalar ? (
              <p className="microcopy">
                Water-column currents show genuine horizontal u/v vectors at their model depths. No vertical current is inferred; vertical exaggeration changes display geometry only.
              </p>
            ) : (
              <p className="microcopy">
                Opacity and vertical exaggeration change display geometry only; scientific values
                and depth metres remain unchanged.
              </p>
            )}
          </div>
        </details>
      </section>

      <section className="water-column-story" id="explore-depth">
        <div className="section-kicker">Water column</div>
        {surfaceOnly ? (
          <div className="surface-only-control" aria-label="Surface-only scientific field">
            <strong>Surface field only</strong>
            <span>No model depth coordinate exists for this satellite chlorophyll product.</span>
          </div>
        ) : (
          <div
            className="bathymetric-depth-controller"
            data-depth-zone={currentDepthZone.toLowerCase()}
            data-track-allocation="40-35-25"
          >
            <div className="selected-depth-hero">
              <span>SELECTED DEPTH · {currentDepthZone.toUpperCase()}</span>
              <strong>{depth.toFixed(2)} m</strong>
              <small>Depth is positive downward · display exaggeration never changes source metres</small>
            </div>

            <div className="depth-zone-track" aria-label="Oceanographic depth zones">
              <button
                type="button"
                className={currentDepthZone === "Epipelagic" ? "active" : ""}
                disabled={!zoneAvailability.epipelagic}
                onClick={() => selectDepthZone(0, EPipelagic_END_M, 100)}
                aria-label="Epipelagic zone 0 to 200 metres"
              >
                <strong>Epipelagic</strong>
                <span>0–200 m</span>
              </button>
              <button
                type="button"
                className={currentDepthZone === "Mesopelagic" ? "active" : ""}
                disabled={!zoneAvailability.mesopelagic}
                onClick={() => selectDepthZone(EPipelagic_END_M + Number.EPSILON, MESOPELAGIC_END_M, 600)}
                aria-label="Mesopelagic zone 200 to 1000 metres"
              >
                <strong>Mesopelagic</strong>
                <span>200–1,000 m</span>
              </button>
              <button
                type="button"
                className={currentDepthZone === "Bathypelagic" ? "active" : ""}
                disabled={!zoneAvailability.bathypelagic}
                onClick={() => selectDepthZone(MESOPELAGIC_END_M + Number.EPSILON, Number.POSITIVE_INFINITY, 2000)}
                aria-label="Bathypelagic zone deeper than 1000 metres"
              >
                <strong>Bathypelagic</strong>
                <span>1,000–4,000+ m</span>
              </button>
            </div>

            <div className="nonlinear-depth-slider-shell">
              <input
                type="range"
                aria-label="Model depth"
                min={0}
                max={DEPTH_TRACK_MAX}
                step={1}
                value={Math.round(depthTrackPosition)}
                onChange={(event) => selectDepthFromTrack(Number(event.target.value))}
              />
              <div className="depth-track-allocation" aria-hidden="true">
                <span className="epipelagic" />
                <span className="mesopelagic" />
                <span className="bathypelagic" />
              </div>
            </div>

            <div className="depth-controller-meta">
              <span>40% surface · 35% twilight · 25% deep track</span>
              <span>{depths.length} verified levels · source max {deepestVerifiedDepth.toFixed(1)} m</span>
            </div>
            {!zoneAvailability.bathypelagic && (
              <p className="depth-availability-note">
                Deeper-zone geometry is shown for orientation only; this source has no verified level below {deepestVerifiedDepth.toFixed(1)} m.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="time-story" id="explore-time">
        <div className="section-kicker">Time</div>
        {catalog.capabilities.time_animation ? (
          <TimelineScrubber
            times={catalog.coordinates.time}
            currentIndex={timeIndex}
            playing={playing}
            playbackSpeed={playbackSpeed}
            observations={timelineObservations}
            onIndexChange={onTimeChange}
            onPlayingChange={onPlayingChange}
            onPlaybackSpeedChange={onPlaybackSpeedChange}
          />
        ) : (
          <div className="time-row static-time-row" aria-label="Verified model timestamp">
            <div>
              <strong>{time.replace("T00:00:00Z", "")}</strong>
              <span>One genuine model timestamp · static GLORYS baseline · never duplicated to simulate time</span>
            </div>
          </div>
        )}
      </section>

      <section className="observation-story" id="explore-observations">
        <div className="section-kicker">Observations</div>
        <p className="section-story-copy">
          In-situ profiles connect the numerical field to measured ocean conditions. Argo provides
          the deepest model-comparison workflow; Glider, CTD and BGC profiles share the same
          geospatial observation contract in the Explorer.
        </p>
        <label>
          Argo profile
          <select
            value={selectedProfileId}
            disabled={profiles.length === 0}
            onChange={(event) => onProfileChange(event.target.value)}
          >
            {profiles.length === 0 && <option value="">No verified profile available</option>}
            {profiles.map((profile) => (
              <option key={profile.profile_id} value={profile.profile_id}>
                {profile.platform_id} · cycle {profile.cycle} {profile.direction}
              </option>
            ))}
          </select>
        </label>
        <p className={`microcopy ${profiles.length === 0 ? "warning" : ""}`}>
          {profiles.length === 0
            ? surfaceOnly
              ? "Argo comparison is not applied to this separate satellite ocean-colour product."
              : "Observation layer unavailable; verified model fields remain usable."
            : "Markers on the globe are also clickable."}
        </p>
      </section>

      <section className="source-card">
        <div className="section-kicker">Source status</div>
        <strong>{catalog.dataset.label}</strong>
        <span>{catalog.dataset.product}</span>
        <div className="badges">
          <span className="badge">{surfaceOnly ? "SATELLITE OCEAN COLOUR" : "REANALYSIS"}</span>
          <span className="badge success">CACHED VERIFIED</span>
        </div>
        <small>{catalog.dataset.region}</small>
        <p className="source-status-note">
          This bounded verified window keeps the live demonstration reproducible while preserving
          the same adapter and provenance architecture used for broader operational deployment.
        </p>
      </section>
    </aside>
  );
}