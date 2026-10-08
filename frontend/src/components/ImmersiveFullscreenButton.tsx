import { useEffect, useState } from "react";

/**
 * Browser fullscreen is permission/gesture gated. Never auto-trigger it during
 * mount: that is rejected by Chromium/Firefox/Safari. Provide a genuine action
 * and preserve a usable full-viewport page when the API is denied.
 */
export function ImmersiveFullscreenButton() {
  const [active, setActive] = useState(() => Boolean(document.fullscreenElement));
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sync = () => { setActive(Boolean(document.fullscreenElement)); setMessage(""); };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggle = async () => {
    if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen) {
      setMessage("Browser fullscreen is unavailable. On a desktop, try F11; you can still explore the full-page view.");
      return;
    }
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      setMessage("");
    } catch {
      setMessage("Fullscreen permission was denied by the browser. Try F11 or keep exploring in the maximized page.");
    }
  };

  return (
    <div className="immersive-screen-entry">
      <button type="button" className="immersive-screen-button"
        aria-label={active ? "Exit fullscreen Ocean Canvas" : "Enter fullscreen Ocean Canvas"}
        aria-pressed={active}
        title={active ? "Exit fullscreen (Esc)" : "Fill the entire screen (browser permission required)"}
        onClick={() => void toggle()}>
        {active ? "Exit full screen ↙" : "⛶ Full screen"}
      </button>
      {message && <span role="status" className="immersive-screen-note">{message}</span>}
    </div>
  );
}
