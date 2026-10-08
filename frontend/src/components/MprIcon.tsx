import type { ReactNode } from "react";

/**
 * RUI-MPR-01 reusable line icon vocabulary.
 * CurrentColor (rather than Arctic-specific colours) is deliberate: the same
 * glyphs must work in all 16 light/dark glass themes and in forced colours.
 * Screen-reader labels belong on the adjacent heading/control; use decorative
 * icons by default so they do not introduce duplicate accessible names.
 */
export const MPR_ICON_NAMES = [
  "workspace", "explore", "analyze", "data", "science",
  "globe", "water-column", "block", "layers", "settings",
  "variable", "depth", "time", "observations", "profile",
  "render", "palette", "source", "quality", "sync",
  "warning", "verified", "planned", "compare", "download",
  "expand", "collapse", "fullscreen", "refresh", "focus"
] as const;

export type MprIconName = typeof MPR_ICON_NAMES[number];

const graphics: Record<MprIconName, ReactNode> = {
  workspace: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16M3 10h6" /></>,
  explore: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.5 5-4.5 2 2-4.5z" /></>,
  analyze: <><path d="M4 20V11m5 9V6m5 14V9m5 11V3M2 20h20" /></>,
  data: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/></>,
  science: <><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="4" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  "water-column": <><path d="m4 7 8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10M7 13h3m4-1h3"/></>,
  block: <><path d="m12 2 9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/></>,
  layers: <><path d="m12 2 9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/></>,
  settings: <><path d="M4 7h16M4 17h16M4 12h16"/><circle cx="9" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="8" cy="17" r="2" fill="currentColor" stroke="none"/></>,
  variable: <><path d="M12 3v11M9 14a4 4 0 1 0 6 0V6a3 3 0 0 0-6 0z"/><path d="M12 17v2"/></>,
  depth: <><path d="M12 3v13m-4-4 4 4 4-4M4 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/></>,
  time: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></>,
  observations: <><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="m10 7-4 10m8-10 4 10M7 19h10"/></>,
  profile: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8m-8 4h5"/></>,
  render: <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 16l3-5 3 3 2-4"/></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 1-4c-.5-.4-.3-1.2.2-1.7 2-1.8 6.4-1.4 5.8-5C20.3 6.3 16.7 3 12 3z"/><circle cx="7" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="7" r="1" fill="currentColor" stroke="none"/></>,
  source: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/></>,
  quality: <><path d="m12 2 8 3v6c0 5-3 8-8 11-5-3-8-6-8-11V5z"/><path d="m8 12 3 3 5-6"/></>,
  sync: <><path d="M20 7v5h-5M4 17v-5h5M6 9a7 7 0 0 1 12-2l2 5M4 12l2 5a7 7 0 0 0 12-2"/></>,
  warning: <><path d="m12 3 10 18H2zM12 9v5M12 18h.01"/></>,
  verified: <><circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/></>,
  planned: <><circle cx="12" cy="12" r="9" strokeDasharray="3 3"/><path d="M12 7v5l3 2"/></>,
  compare: <><path d="M4 7h16m-4-3 4 3-4 3M20 17H4m4-3-4 3 4 3"/></>,
  download: <><path d="M12 3v13m-5-5 5 5 5-5M4 18v3h16v-3"/></>,
  expand: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M3 3l6 6m12-6-6 6M3 21l6-6m12 6-6-6"/></>,
  collapse: <><path d="M9 9H3V3m12 6h6V3M9 15H3v6m12-6h6v6M3 3l6 6m12-6-6 6M3 21l6-6m12 6-6-6"/></>,
  fullscreen: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5M6 9a7 7 0 0 1 12-2l2 5M4 12l2 5a7 7 0 0 0 12-2"/></>,
  focus: <><circle cx="12" cy="12" r="5"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></>
};

interface Props {
  name: MprIconName;
  size?: number;
  label?: string;
  className?: string;
}

export function MprIcon({ name, size = 20, label, className }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : "presentation"}
      focusable="false"
    >
      {graphics[name]}
    </svg>
  );
}
