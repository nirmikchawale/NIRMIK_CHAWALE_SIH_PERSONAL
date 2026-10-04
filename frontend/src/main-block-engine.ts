export type MainBlockMaterialization = "verified-baseline" | "pilot" | "planned";
export type MainBlockRegion =
  | "Western Arabian Sea"
  | "Central Arabian Sea"
  | "India West Coast"
  | "Lakshadweep & Southern Arabian Sea"
  | "South of India"
  | "India East Coast"
  | "Bay of Bengal"
  | "Andaman & Nicobar"
  | "Eastern Indian Ocean";

export interface MainBlockBounds {
  west: number;
  east: number;
  south: number;
  north: number;
}

export interface MainBlockTemporalSchema {
  historicalDailySlots: boolean;
  operationalNativeTimeSlots: boolean;
  interpolatedTimeDisclosure: boolean;
}

export interface OceanMainBlock extends MainBlockBounds {
  id: string;
  row: number;
  column: number;
  region: MainBlockRegion;
  materialization: MainBlockMaterialization;
  sourceProduct: string;
  variables: readonly ["thetao", "so", "currents"];
  temporalSchema: MainBlockTemporalSchema;
  availableDates: readonly string[];
  nativeTimesUtc: readonly string[];
}

export interface VerifiedBaselineBlock extends MainBlockBounds {
  id: "BASE-GLORYS-001";
  label: string;
  sourceProduct: string;
  sourceDatasetId: string;
  variables: readonly ["thetao", "so", "currents"];
  availableDates: readonly ["2024-01-02"];
  timeSemantics: "daily-mean";
  depthLevels: 31;
  materialization: "verified-baseline";
}

export const MAIN_BLOCK_ENGINE_VERSION = "phase-3.5d-v1";
export const TARGET_BLOCK_COUNT = 140;
export const TARGET_DOMAIN = {
  west: 60,
  east: 100,
  south: 5,
  north: 25,
  columns: 14,
  rows: 10
} as const;

export const CURRENT_VERIFIED_BASELINE: VerifiedBaselineBlock = {
  id: "BASE-GLORYS-001",
  label: "Current verified GLORYS baseline",
  west: 67,
  east: 70,
  south: 12,
  north: 14,
  sourceProduct: "Copernicus Marine GLORYS12V1",
  sourceDatasetId: "cmems_mod_glo_phy_my_0.083deg_P1D-m",
  variables: ["thetao", "so", "currents"],
  availableDates: ["2024-01-02"],
  timeSemantics: "daily-mean",
  depthLevels: 31,
  materialization: "verified-baseline"
};

const longitudeEdges = [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 100] as const;

function classifyRegion(west: number, east: number, south: number, north: number): MainBlockRegion {
  const lon = (west + east) / 2;
  const lat = (south + north) / 2;

  if (lon < 66) return "Western Arabian Sea";
  if (lon < 72) return lat < 10 ? "Lakshadweep & Southern Arabian Sea" : "Central Arabian Sea";
  if (lon < 77) return lat < 10 ? "Lakshadweep & Southern Arabian Sea" : "India West Coast";
  if (lon < 82) return lat < 10 ? "South of India" : lat < 15 ? "India East Coast" : "Bay of Bengal";
  if (lon < 92) return lat < 9 ? "Eastern Indian Ocean" : "Bay of Bengal";
  if (lon < 96) return lat < 16 ? "Andaman & Nicobar" : "Bay of Bengal";
  return "Eastern Indian Ocean";
}

function buildTargetBlocks(): OceanMainBlock[] {
  const blocks: OceanMainBlock[] = [];
  let index = 1;

  for (let row = 0; row < TARGET_DOMAIN.rows; row += 1) {
    const north = TARGET_DOMAIN.north - row * 2;
    const south = north - 2;

    for (let column = 0; column < TARGET_DOMAIN.columns; column += 1) {
      const west = longitudeEdges[column];
      const east = longitudeEdges[column + 1];
      blocks.push({
        id: `IO-${String(index).padStart(3, "0")}`,
        row,
        column,
        west,
        east,
        south,
        north,
        region: classifyRegion(west, east, south, north),
        materialization: "planned",
        sourceProduct: "Copernicus Marine GLORYS12V1 / operational companion when materialized",
        variables: ["thetao", "so", "currents"],
        temporalSchema: {
          historicalDailySlots: true,
          operationalNativeTimeSlots: true,
          interpolatedTimeDisclosure: true
        },
        availableDates: [],
        nativeTimesUtc: []
      });
      index += 1;
    }
  }

  return blocks;
}

export const INDIAN_OCEAN_MAIN_BLOCKS = buildTargetBlocks();

export const MAIN_BLOCK_REGIONS = Array.from(
  new Set(INDIAN_OCEAN_MAIN_BLOCKS.map((block) => block.region))
) as MainBlockRegion[];

export function intersectsBaseline(block: OceanMainBlock): boolean {
  return !(
    block.east <= CURRENT_VERIFIED_BASELINE.west ||
    block.west >= CURRENT_VERIFIED_BASELINE.east ||
    block.north <= CURRENT_VERIFIED_BASELINE.south ||
    block.south >= CURRENT_VERIFIED_BASELINE.north
  );
}

export function blockBoundsLabel(block: MainBlockBounds): string {
  return `${block.west.toFixed(0)}–${block.east.toFixed(0)}°E · ${block.south.toFixed(0)}–${block.north.toFixed(0)}°N`;
}
