import { INDIAN_OCEAN_MAIN_BLOCKS, type OceanMainBlock } from "./main-block-engine";

export const MAIN_BLOCK_OCEAN_MASK_VERSION = "3db-07-ocean-mask-v1";

/**
 * These IDs are derived from the accepted main-block manifest entries whose
 * ocean_fraction is exactly 0. The list is regression-checked against the
 * manifest so a future acquisition/mask change cannot silently drift.
 *
 * Mixed ocean+land cells are intentionally NOT excluded: the product rule is
 * "retain any block with genuine ocean intersection; remove only land-only
 * cells".
 */
export const LAND_ONLY_MAIN_BLOCK_IDS = [
  "IO-004", "IO-005", "IO-006", "IO-007", "IO-008", "IO-009", "IO-010",
  "IO-011", "IO-012", "IO-013", "IO-014", "IO-020", "IO-021", "IO-022",
  "IO-026", "IO-027", "IO-028", "IO-034", "IO-035", "IO-036", "IO-041",
  "IO-042", "IO-048", "IO-049", "IO-056", "IO-062", "IO-070", "IO-076"
] as const;

const LAND_ONLY_SET = new Set<string>(LAND_ONLY_MAIN_BLOCK_IDS);

export const OCEAN_INTERSECTING_MAIN_BLOCKS: readonly OceanMainBlock[] =
  INDIAN_OCEAN_MAIN_BLOCKS.filter((block) => !LAND_ONLY_SET.has(block.id));

export const LAND_ONLY_BLOCK_COUNT = LAND_ONLY_MAIN_BLOCK_IDS.length;
export const OCEAN_INTERSECTING_BLOCK_COUNT = OCEAN_INTERSECTING_MAIN_BLOCKS.length;

export function isOceanIntersectingMainBlockId(id: string | null | undefined): boolean {
  return typeof id === "string" && !LAND_ONLY_SET.has(id)
    && INDIAN_OCEAN_MAIN_BLOCKS.some((block) => block.id === id);
}

export function isOceanIntersectingMainBlock(block: OceanMainBlock): boolean {
  return !LAND_ONLY_SET.has(block.id);
}

/**
 * Judge-facing yellow field scale. Low ocean coverage is light yellow; high
 * ocean coverage is darker gold. The fraction is display metadata only and
 * never alters source measurements or block eligibility.
 */
export function oceanCoverageYellow(fraction: number): string {
  const t = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0));
  const lightness = 88 - 38 * t;
  return `hsl(48 96% ${lightness.toFixed(1)}%)`;
}

export function oceanCoverageYellowGradient(fraction: number): string {
  const t = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0));
  const lightA = 94 - 26 * t;
  const lightB = 82 - 38 * t;
  return `linear-gradient(135deg, hsl(52 98% ${lightA.toFixed(1)}%) 0%, hsl(44 94% ${lightB.toFixed(1)}%) 100%)`;
}
