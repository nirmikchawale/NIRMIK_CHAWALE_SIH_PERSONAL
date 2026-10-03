import {
  CURRENT_VERIFIED_BASELINE,
  INDIAN_OCEAN_MAIN_BLOCKS,
  type OceanMainBlock,
  type VerifiedBaselineBlock
} from "./main-block-engine";

export const ACTIVE_MAIN_BLOCK_STORAGE_KEY = "oceancanvas-active-main-block-v1";
export const ACTIVE_MAIN_BLOCK_EVENT = "oceancanvas:active-main-block";

export type ActiveMainBlock = OceanMainBlock | VerifiedBaselineBlock;

export function resolveMainBlock(id: string | null | undefined): ActiveMainBlock {
  if (id === CURRENT_VERIFIED_BASELINE.id) return CURRENT_VERIFIED_BASELINE;
  return INDIAN_OCEAN_MAIN_BLOCKS.find((block) => block.id === id) ?? CURRENT_VERIFIED_BASELINE;
}

export function readActiveMainBlockId(): string {
  try {
    const stored = window.localStorage.getItem(ACTIVE_MAIN_BLOCK_STORAGE_KEY);
    return resolveMainBlock(stored).id;
  } catch {
    return CURRENT_VERIFIED_BASELINE.id;
  }
}

export function publishActiveMainBlockId(id: string): string {
  const resolved = resolveMainBlock(id);
  try {
    window.localStorage.setItem(ACTIVE_MAIN_BLOCK_STORAGE_KEY, resolved.id);
  } catch {
    // Selection remains usable for this browser session when storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent<string>(ACTIVE_MAIN_BLOCK_EVENT, { detail: resolved.id }));
  return resolved.id;
}

export function subscribeActiveMainBlock(listener: (id: string) => void): () => void {
  const onSelection = (event: Event) => {
    const detail = (event as CustomEvent<string>).detail;
    listener(resolveMainBlock(detail).id);
  };
  window.addEventListener(ACTIVE_MAIN_BLOCK_EVENT, onSelection);
  return () => window.removeEventListener(ACTIVE_MAIN_BLOCK_EVENT, onSelection);
}

export function findTargetBlockAt(longitude: number, latitude: number): OceanMainBlock | null {
  return INDIAN_OCEAN_MAIN_BLOCKS.find((block) =>
    longitude >= block.west && longitude <= block.east &&
    latitude >= block.south && latitude <= block.north
  ) ?? null;
}

export function activeMainBlockRegion(block: ActiveMainBlock): string {
  return "region" in block ? block.region : "Verified GLORYS baseline";
}

export function isVerifiedBaseline(block: ActiveMainBlock): block is VerifiedBaselineBlock {
  return block.id === CURRENT_VERIFIED_BASELINE.id;
}
