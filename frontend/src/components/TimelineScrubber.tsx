import { useEffect, useMemo, useRef } from "react";

import {
  buildScientificTimeModel,
  formatScientificTimestamp,
  publishScientificTimeContext,
  readTimeFromHash,
  resolveTimeIndex,
  writeTimeToHash,
  type ScientificTimeKind
} from "../time-engine";

interface TimelineObservation {
  timestamp: string;
  label: string;
}

interface Props {
  times: string[];
  currentIndex: number;
  playing: boolean;
  playbackSpeed: number;
  observations: TimelineObservation[];
  timeKinds?: ScientificTimeKind[];
  onIndexChange: (index: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onPlaybackSpeedChange: (speed: number) => void;
}

const SPEEDS = [0.5, 1, 2, 5] as const;

function utcDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function displayTime(value: string) {
  return formatScientificTimestamp(value);
}

export function TimelineScrubber({
  times,
  currentIndex,
  playing,
  playbackSpeed,
  observations,
  timeKinds,
  onIndexChange,
  onPlayingChange,
  onPlaybackSpeedChange
}: Props) {
  const timeKey = times.join("|");
  const model = useMemo(
    () => buildScientificTimeModel(times, currentIndex, timeKinds),
    [timeKey, currentIndex, timeKinds]
  );
  const maximum = Math.max(0, model.steps.length - 1);
  const index = model.selectedIndex;
  const selectedStep = model.selectedStep;
  const selectedTime = selectedStep?.timestamp ?? "Unavailable";
  const selectedDate = selectedStep?.dateUtc ?? "Unavailable";
  const selectedDateSteps = model.steps.filter((step) => step.dateUtc === selectedDate);
  const dayToIndex = new Map(times.map((time, timeIndex) => [utcDay(time), timeIndex]));
  const markers = observations
    .map((observation) => {
      const matchedIndex = dayToIndex.get(utcDay(observation.timestamp));
      return matchedIndex == null ? null : { ...observation, matchedIndex };
    })
    .filter((marker): marker is TimelineObservation & { matchedIndex: number } => marker !== null);
  const groupedMarkers = [...markers.reduce((map, marker) => {
    const existing = map.get(marker.matchedIndex) ?? [];
    existing.push(marker.label);
    map.set(marker.matchedIndex, existing);
    return map;
  }, new Map<number, string[]>()).entries()];
  const restoredForTimeKey = useRef("");
  const pendingRestoreTimestamp = useRef<string | null>(null);

  useEffect(() => {
    if (restoredForTimeKey.current === timeKey) return;
    restoredForTimeKey.current = timeKey;
    const requestedTimestamp = readTimeFromHash();
    const requestedIndex = resolveTimeIndex(times, requestedTimestamp);
    if (requestedTimestamp && requestedIndex != null && requestedIndex !== index) {
      pendingRestoreTimestamp.current = requestedTimestamp;
      onIndexChange(requestedIndex);
    }
  }, [timeKey, times, index, onIndexChange]);

  useEffect(() => {
    if (!selectedStep) {
      publishScientificTimeContext(null);
      return;
    }
    if (
      pendingRestoreTimestamp.current &&
      resolveTimeIndex([selectedStep.timestamp], pendingRestoreTimestamp.current) == null
    ) {
      return;
    }
    pendingRestoreTimestamp.current = null;
    writeTimeToHash(selectedStep.timestamp);
    publishScientificTimeContext(selectedStep);
  }, [selectedStep]);

  const step = (delta: number) => {
    if (model.steps.length === 0) return;
    onIndexChange((index + delta + model.steps.length) % model.steps.length);
  };

  const selectDate = (dateUtc: string) => {
    const first = model.steps.find((stepItem) => stepItem.dateUtc === dateUtc);
    if (first) onIndexChange(first.index);
  };

  const selectTimestamp = (timestamp: string) => {
    const stepItem = model.steps.find((candidate) => candidate.timestamp === timestamp);
    if (stepItem) onIndexChange(stepItem.index);
  };

  return (
    <div
      className="timeline-scrubber phase35c-time-engine"
      data-phase="3.5c"
      data-playback-speed={playbackSpeed}
      data-marker-count={groupedMarkers.length}
      data-date-count={model.dates.length}
      data-native-count={model.nativeCount}
      data-interpolated-count={model.interpolatedCount}
      data-time-kind={selectedStep?.kind ?? "unavailable"}
      aria-label="Genuine ocean timeline scrubber"
    >
      <div className="timeline-now">
        <div>
          <span>PHASE 3.5C · ACTIVE UTC STEP</span>
          <strong>{displayTime(selectedTime)}</strong>
        </div>
        <div className="phase35c-time-badges" aria-label="Time provenance status">
          <span className={`phase35c-time-kind ${selectedStep?.kind ?? "unavailable"}`}>
            {selectedStep?.kind === "interpolated" ? "INTERPOLATED" : selectedStep ? "NATIVE SOURCE TIME" : "UNAVAILABLE"}
          </span>
          <span className="phase35c-interpolation-status">
            {model.interpolatedCount > 0 ? `${model.interpolatedCount} LABELLED INTERPOLATED` : "INTERPOLATION OFF"}
          </span>
        </div>
        <small>
          {model.nativeCount} genuine timestamp{model.nativeCount === 1 ? "" : "s"}
          {model.dates.length > 1 ? ` across ${model.dates.length} UTC dates` : ""}
          {" · "}source times are never duplicated to simulate playback
        </small>
      </div>

      <div className="phase35c-time-picker" aria-label="Native date and time selection">
        <label>
          <span>Native date</span>
          <select
            aria-label="Native date"
            value={selectedDate}
            disabled={model.dates.length <= 1}
            onChange={(event) => selectDate(event.target.value)}
          >
            {model.dates.map((dateUtc) => <option key={dateUtc} value={dateUtc}>{dateUtc}</option>)}
          </select>
        </label>
        <label>
          <span>Native UTC time</span>
          <select
            aria-label="Native UTC time"
            value={selectedStep?.timestamp ?? ""}
            disabled={selectedDateSteps.length <= 1}
            onChange={(event) => selectTimestamp(event.target.value)}
          >
            {selectedDateSteps.map((stepItem) => (
              <option key={stepItem.timestamp} value={stepItem.timestamp}>
                {stepItem.clockUtc}{stepItem.kind === "interpolated" ? " · INTERPOLATED" : " · NATIVE"}
              </option>
            ))}
          </select>
        </label>
        <div className="phase35c-time-context-note">
          <span>URL CONTEXT</span>
          <strong>Synced</strong>
          <small>Refresh/deep-link restores an exact available timestamp.</small>
        </div>
      </div>

      <div className="timeline-transport" role="group" aria-label="Timeline playback controls">
        <button type="button" aria-label="Previous genuine time step" disabled={!model.canPlayback} onClick={() => step(-1)}>⏮</button>
        <button
          type="button"
          className="timeline-play-toggle"
          aria-label={playing ? "Pause genuine Explore time playback" : "Play genuine Explore time playback"}
          aria-pressed={playing}
          disabled={!model.canPlayback}
          onClick={() => onPlayingChange(!playing)}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button type="button" aria-label="Next genuine time step" disabled={!model.canPlayback} onClick={() => step(1)}>⏭</button>
      </div>

      <div className="timeline-track-shell">
        <input
          type="range"
          aria-label="Explore genuine timestamp"
          min={0}
          max={maximum}
          step={1}
          value={index}
          disabled={!model.canPlayback}
          onChange={(event) => onIndexChange(Number(event.target.value))}
        />
        <div className="timeline-surfacing-markers" aria-label="Verified Argo surfacing date markers">
          {groupedMarkers.map(([markerIndex, labels]) => {
            const position = maximum > 0 ? (markerIndex / maximum) * 100 : 0;
            return (
              <button
                type="button"
                key={markerIndex}
                className={markerIndex === index ? "active" : ""}
                style={{ left: `${position}%` }}
                aria-label={`Argo surfacing marker at ${displayTime(times[markerIndex] ?? "")}`}
                title={labels.join(" · ")}
                onClick={() => onIndexChange(markerIndex)}
              />
            );
          })}
        </div>
      </div>

      <div className="timeline-footer">
        <div className="timeline-speed" role="group" aria-label="Timeline playback speed">
          {SPEEDS.map((speed) => (
            <button
              type="button"
              key={speed}
              className={playbackSpeed === speed ? "active" : ""}
              aria-pressed={playbackSpeed === speed}
              aria-label={`Playback speed ${speed} times`}
              disabled={!model.canPlayback}
              onClick={() => onPlaybackSpeedChange(speed)}
            >
              {speed.toFixed(1)}×
            </button>
          ))}
        </div>
        <small>
          {groupedMarkers.length > 0
            ? `${groupedMarkers.length} timeline date${groupedMarkers.length === 1 ? "" : "s"} coincide with verified Argo surfacing records.`
            : "No verified Argo surfacing date intersects this active source window."}
        </small>
      </div>
    </div>
  );
}
