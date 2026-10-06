import {
  INDIAN_OCEAN_MAIN_BLOCKS,
  TARGET_BLOCK_COUNT,
  TARGET_DOMAIN,
  type MainBlockBounds,
  type MainBlockRegion,
  type OceanMainBlock
} from "./main-block-engine";

export const MAIN_BLOCK_GEOGRAPHY_VERSION = "3db-03-v1";

export interface MainBlockCoordinate {
  longitude: number;
  latitude: number;
}

export interface MainBlockGeographicFootprint {
  id: string;
  row: number;
  column: number;
  region: MainBlockRegion;
  bounds: MainBlockBounds;
  center: MainBlockCoordinate;
  /** Closed [longitude, latitude] ring for renderer-neutral geographic consumers. */
  polygon: readonly [
    readonly [number, number],
    readonly [number, number],
    readonly [number, number],
    readonly [number, number],
    readonly [number, number]
  ];
}

/**
 * 3DB-03 canonical ownership rule.
 *
 * Adjacent cells share geographic edges, but a point must resolve to exactly one
 * logical target. Longitude therefore uses [west, east) except for the final
 * eastern column, which owns 100°E. Latitude uses (south, north] except for the
 * final southern row, which also owns 5°N. This preserves all four outer domain
 * boundaries while removing the previous shared-edge ambiguity.
 */
export const MAIN_BLOCK_POINT_OWNERSHIP = {
  longitude: "west-inclusive/east-exclusive; eastern domain edge included by final column",
  latitude: "north-inclusive/south-exclusive; southern domain edge included by final row"
} as const;

function isFiniteCoordinate(longitude: number, latitude: number): boolean {
  return Number.isFinite(longitude) && Number.isFinite(latitude);
}

export function isCoordinateInMainBlockDomain(longitude: number, latitude: number): boolean {
  return isFiniteCoordinate(longitude, latitude)
    && longitude >= TARGET_DOMAIN.west
    && longitude <= TARGET_DOMAIN.east
    && latitude >= TARGET_DOMAIN.south
    && latitude <= TARGET_DOMAIN.north;
}

export function blockOwnsCoordinate(
  block: OceanMainBlock,
  longitude: number,
  latitude: number
): boolean {
  if (!isCoordinateInMainBlockDomain(longitude, latitude)) return false;

  const easternEdgeOwner = block.column === TARGET_DOMAIN.columns - 1;
  const southernEdgeOwner = block.row === TARGET_DOMAIN.rows - 1;

  const longitudeOwned = longitude >= block.west
    && (longitude < block.east || (easternEdgeOwner && longitude <= block.east));
  const latitudeOwned = latitude <= block.north
    && (latitude > block.south || (southernEdgeOwner && latitude >= block.south));

  return longitudeOwned && latitudeOwned;
}

export function findGeographicMainBlockAt(
  longitude: number,
  latitude: number
): OceanMainBlock | null {
  if (!isCoordinateInMainBlockDomain(longitude, latitude)) return null;
  return INDIAN_OCEAN_MAIN_BLOCKS.find((block) => blockOwnsCoordinate(block, longitude, latitude)) ?? null;
}

export function geographicFootprintForBlock(block: OceanMainBlock): MainBlockGeographicFootprint {
  const center = {
    longitude: (block.west + block.east) / 2,
    latitude: (block.south + block.north) / 2
  };

  return {
    id: block.id,
    row: block.row,
    column: block.column,
    region: block.region,
    bounds: {
      west: block.west,
      east: block.east,
      south: block.south,
      north: block.north
    },
    center,
    polygon: [
      [block.west, block.south],
      [block.east, block.south],
      [block.east, block.north],
      [block.west, block.north],
      [block.west, block.south]
    ]
  };
}

export const MAIN_BLOCK_GEOGRAPHIC_FOOTPRINTS: ReadonlyArray<MainBlockGeographicFootprint> =
  INDIAN_OCEAN_MAIN_BLOCKS.map(geographicFootprintForBlock);

export function geographicFootprintById(id: string): MainBlockGeographicFootprint | null {
  return MAIN_BLOCK_GEOGRAPHIC_FOOTPRINTS.find((footprint) => footprint.id === id) ?? null;
}

export interface MainBlockGeographyAudit {
  version: string;
  blockCount: number;
  uniqueIdCount: number;
  uniqueRowColumnCount: number;
  expectedDomainAreaDegreesSquared: number;
  coveredAreaDegreesSquared: number;
  everyBlockInsideDomain: boolean;
  everyCenterResolvesToSelf: boolean;
  outerCornersCovered: boolean;
}

export function auditMainBlockGeography(): MainBlockGeographyAudit {
  const ids = new Set<string>();
  const rowColumns = new Set<string>();
  let coveredAreaDegreesSquared = 0;
  let everyBlockInsideDomain = true;
  let everyCenterResolvesToSelf = true;

  for (const block of INDIAN_OCEAN_MAIN_BLOCKS) {
    ids.add(block.id);
    rowColumns.add(`${block.row}:${block.column}`);
    coveredAreaDegreesSquared += (block.east - block.west) * (block.north - block.south);

    everyBlockInsideDomain &&= block.west >= TARGET_DOMAIN.west
      && block.east <= TARGET_DOMAIN.east
      && block.south >= TARGET_DOMAIN.south
      && block.north <= TARGET_DOMAIN.north
      && block.west < block.east
      && block.south < block.north;

    const centerLongitude = (block.west + block.east) / 2;
    const centerLatitude = (block.south + block.north) / 2;
    everyCenterResolvesToSelf &&= findGeographicMainBlockAt(centerLongitude, centerLatitude)?.id === block.id;
  }

  const corners: ReadonlyArray<readonly [number, number]> = [
    [TARGET_DOMAIN.west, TARGET_DOMAIN.north],
    [TARGET_DOMAIN.east, TARGET_DOMAIN.north],
    [TARGET_DOMAIN.west, TARGET_DOMAIN.south],
    [TARGET_DOMAIN.east, TARGET_DOMAIN.south]
  ];
  const outerCornersCovered = corners.every(([longitude, latitude]) =>
    findGeographicMainBlockAt(longitude, latitude) !== null
  );

  return {
    version: MAIN_BLOCK_GEOGRAPHY_VERSION,
    blockCount: INDIAN_OCEAN_MAIN_BLOCKS.length,
    uniqueIdCount: ids.size,
    uniqueRowColumnCount: rowColumns.size,
    expectedDomainAreaDegreesSquared:
      (TARGET_DOMAIN.east - TARGET_DOMAIN.west) * (TARGET_DOMAIN.north - TARGET_DOMAIN.south),
    coveredAreaDegreesSquared,
    everyBlockInsideDomain,
    everyCenterResolvesToSelf,
    outerCornersCovered
  };
}

export function assertCanonicalMainBlockGeography(): void {
  const audit = auditMainBlockGeography();
  const areaTolerance = 1e-9;

  if (audit.blockCount !== TARGET_BLOCK_COUNT) {
    throw new Error(`Expected ${TARGET_BLOCK_COUNT} geographic blocks, received ${audit.blockCount}.`);
  }
  if (audit.uniqueIdCount !== TARGET_BLOCK_COUNT || audit.uniqueRowColumnCount !== TARGET_BLOCK_COUNT) {
    throw new Error("Main-block geographic IDs or row/column coordinates are not unique.");
  }
  if (!audit.everyBlockInsideDomain || !audit.everyCenterResolvesToSelf || !audit.outerCornersCovered) {
    throw new Error("Main-block geographic ownership contract failed.");
  }
  if (Math.abs(audit.coveredAreaDegreesSquared - audit.expectedDomainAreaDegreesSquared) > areaTolerance) {
    throw new Error("Main-block geographic footprints do not cover the configured target domain exactly.");
  }
}
