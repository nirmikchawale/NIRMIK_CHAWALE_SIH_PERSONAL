import { useRef, useState, type PointerEvent } from "react";

import { ThemePicker } from "./ThemePicker";

const THRESHOLD = 72;

export function RefreshControl() {
  const [distance, setDistance] = useState(0);
  const [busy, setBusy] = useState(false);
  const origin = useRef<{ id: number; x: number; y: number } | null>(null);
  const pull = useRef(0);
  const suppressClick = useRef(false);
  const reloading = useRef(false);
  const refresh = () => {
    if (reloading.current) return;
    reloading.current = true;
    setBusy(true);
    window.location.reload();
  };
  const finish = (event: PointerEvent<HTMLButtonElement>, cancelled = false) => {
    if (origin.current?.id !== event.pointerId) return;
    const ready = !cancelled && pull.current >= THRESHOLD;
    suppressClick.current = Math.abs(event.clientY - origin.current.y) > 6 || Math.abs(event.clientX - origin.current.x) > 6;
    origin.current = null;
    pull.current = 0;
    setDistance(0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (ready) refresh();
  };
  return <>
    <button type="button" className="refresh-control" aria-label="Refresh workspace"
      aria-describedby="refresh-gesture-help" aria-busy={busy} disabled={busy}
      title="Click to refresh, or drag down and release" data-pull-ready={distance >= THRESHOLD}
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0 || reloading.current) return;
        suppressClick.current = false;
        origin.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        if (origin.current?.id !== event.pointerId) return;
        pull.current = Math.abs(event.clientX - origin.current.x) > 70 ? 0 : Math.min(110, Math.max(0, event.clientY - origin.current.y));
        setDistance(pull.current);
      }}
      onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)}
      onLostPointerCapture={() => { origin.current = null; pull.current = 0; setDistance(0); }}
      onClick={event => {
        if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return; }
        refresh();
      }}>
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" style={{ transform: `rotate(${Math.min(distance / THRESHOLD, 1) * 180}deg)` }}>
        <path d="M20 7v5h-5M4 17v-5h5M5.4 8a7.5 7.5 0 0 1 12.4-2L20 9M4 15l2.2 3A7.5 7.5 0 0 0 18.6 16" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{busy ? "Refreshing…" : distance >= THRESHOLD ? "Release" : distance > 6 ? "Pull down" : "Refresh"}</span>
      <span id="refresh-gesture-help" className="refresh-help">Click or press Enter to reload this page. Or drag this button down and release when it says Release.</span>
    </button>
    <ThemePicker />
  </>;
}
