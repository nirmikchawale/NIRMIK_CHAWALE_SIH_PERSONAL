export type ThemeScheme = "dark" | "light";

export const GLASS_THEME_IDS = [
  "abyss-noir",
  "aurora-borealis",
  "midnight-indigo",
  "deep-sea-emerald",
  "bioluminescent-cyan",
  "coral-dusk",
  "solar-amber",
  "graphite-clear",
  "polar-frost",
  "arctic-mist",
  "pearl-lagoon",
  "glacier-mint",
  "rose-quartz",
  "lavender-haze",
  "sandglass",
  "cloud-prism"
] as const;

export type GlassThemeId = (typeof GLASS_THEME_IDS)[number];

export interface GlassThemeDefinition {
  id: GlassThemeId;
  label: string;
  shortLabel: string;
  scheme: ThemeScheme;
  family: "ocean" | "aurora" | "mineral" | "warm" | "neutral";
  description: string;
  swatches: readonly [string, string, string];
}

export const GLASS_THEMES: readonly GlassThemeDefinition[] = [
  { id:"abyss-noir", label:"Abyss Noir", shortLabel:"Abyss", scheme:"dark", family:"ocean", description:"Deep navy glass with cool scientific cyan highlights.", swatches:["#07131d","#153345","#80e6ff"] },
  { id:"aurora-borealis", label:"Aurora Borealis", shortLabel:"Aurora", scheme:"dark", family:"aurora", description:"Teal, violet and polar-green light suspended in dark glass.", swatches:["#09161d","#173f45","#b89cff"] },
  { id:"midnight-indigo", label:"Midnight Indigo", shortLabel:"Indigo", scheme:"dark", family:"mineral", description:"Ink-blue glass with indigo and electric-blue depth cues.", swatches:["#0b1020","#252a55","#8fb4ff"] },
  { id:"deep-sea-emerald", label:"Deep Sea Emerald", shortLabel:"Emerald", scheme:"dark", family:"ocean", description:"Blue-black ocean glass with restrained emerald bioluminescence.", swatches:["#071816","#123d37","#7ee8c4"] },
  { id:"bioluminescent-cyan", label:"Bioluminescent Cyan", shortLabel:"Bio Cyan", scheme:"dark", family:"ocean", description:"High-clarity marine glass with luminous cyan instrumentation accents.", swatches:["#041419","#0b3b45","#55f0ff"] },
  { id:"coral-dusk", label:"Coral Dusk", shortLabel:"Coral", scheme:"dark", family:"warm", description:"Plum-black dusk with coral and rose-gold glass reflections.", swatches:["#1a1018","#4b2638","#ff9f9a"] },
  { id:"solar-amber", label:"Solar Amber", shortLabel:"Amber", scheme:"dark", family:"warm", description:"Charcoal glass with amber instrument-light warmth.", swatches:["#19140c","#4b3921","#ffc56f"] },
  { id:"graphite-clear", label:"Graphite Clear", shortLabel:"Graphite", scheme:"dark", family:"neutral", description:"Neutral graphite glass for maximum focus on scientific colour ramps.", swatches:["#111417","#2a3036","#d6e2e8"] },
  { id:"polar-frost", label:"Polar Frost", shortLabel:"Polar", scheme:"light", family:"ocean", description:"Frosted pearl glass with cold blue edges and high daylight legibility.", swatches:["#eef7fb","#d8eaf2","#2f849f"] },
  { id:"arctic-mist", label:"Arctic Mist", shortLabel:"Arctic", scheme:"light", family:"ocean", description:"Cool blue-white mist with soft translucent slate surfaces.", swatches:["#f1f6fb","#dfe9f4","#5c7fa6"] },
  { id:"pearl-lagoon", label:"Pearl Lagoon", shortLabel:"Lagoon", scheme:"light", family:"ocean", description:"Pearl-white glass with lagoon aqua and marine-teal reflections.", swatches:["#f0fbfa","#d8efec","#208f91"] },
  { id:"glacier-mint", label:"Glacier Mint", shortLabel:"Mint", scheme:"light", family:"mineral", description:"Ice-mint surfaces with mineral green and cool silver borders.", swatches:["#f2faf6","#dfeee7","#3d8c70"] },
  { id:"rose-quartz", label:"Rose Quartz", shortLabel:"Quartz", scheme:"light", family:"warm", description:"Soft mineral-white glass with rose and muted berry highlights.", swatches:["#fff6f7","#f0dde4","#a8647c"] },
  { id:"lavender-haze", label:"Lavender Haze", shortLabel:"Lavender", scheme:"light", family:"aurora", description:"Pale lavender glass with cool violet-blue diffraction.", swatches:["#f7f5ff","#e5e0f4","#7568b3"] },
  { id:"sandglass", label:"Sandglass", shortLabel:"Sand", scheme:"light", family:"warm", description:"Warm ivory glass with soft sandstone and ocean-bronze accents.", swatches:["#fbf7ef","#eee3d1","#9a7044"] },
  { id:"cloud-prism", label:"Cloud Prism", shortLabel:"Prism", scheme:"light", family:"neutral", description:"Neutral cloud glass with restrained cyan-violet prismatic edges.", swatches:["#f7f9fb","#e7edf1","#607894"] }
] as const;

export const DEFAULT_GLASS_THEME: GlassThemeId = "abyss-noir";
export const LEGACY_THEME_STORAGE_KEY = "oceantwin-theme";
export const GLASS_THEME_STORAGE_KEY = "oceantwin-glass-theme-v2";

const themeMap = new Map<GlassThemeId, GlassThemeDefinition>(GLASS_THEMES.map((theme) => [theme.id, theme]));

export function isGlassThemeId(value: string | null): value is GlassThemeId {
  return Boolean(value && themeMap.has(value as GlassThemeId));
}

export function getGlassTheme(theme: GlassThemeId): GlassThemeDefinition {
  return themeMap.get(theme) ?? themeMap.get(DEFAULT_GLASS_THEME)!;
}

export function initialGlassTheme(): GlassThemeId {
  try {
    const stored = window.localStorage.getItem(GLASS_THEME_STORAGE_KEY);
    if (isGlassThemeId(stored)) return stored;
    return window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY) === "light" ? "polar-frost" : DEFAULT_GLASS_THEME;
  } catch {
    return DEFAULT_GLASS_THEME;
  }
}
