import { expect, test } from "@playwright/test";
import {
  INDIAN_OCEAN_MAIN_BLOCKS,
  TARGET_BLOCK_COUNT,
  TARGET_DOMAIN
} from "../src/main-block-engine";
import {
  MAIN_BLOCK_GEOGRAPHIC_FOOTPRINTS,
  MAIN_BLOCK_GEOGRAPHY_VERSION,
  MAIN_BLOCK_POINT_OWNERSHIP,
  assertCanonicalMainBlockGeography,
  auditMainBlockGeography,
  findGeographicMainBlockAt,
  geographicFootprintById,
  isCoordinateInMainBlockDomain
} from "../src/main-block-geography";
import {
  PHASE35B_MULTI_DATE_PILOT_IDS,
  PHASE35B_PILOT_IDS,
  findTargetBlockAt,
  resolveMainBlock
} from "../src/main-block-runtime";

test("3DB-03 freezes one canonical 140-footprint geographic contract", () => {
  expect(MAIN_BLOCK_GEOGRAPHY_VERSION).toBe("3db-03-v1");
  expect(MAIN_BLOCK_GEOGRAPHIC_FOOTPRINTS).toHaveLength(TARGET_BLOCK_COUNT);
  expect(new Set(MAIN_BLOCK_GEOGRAPHIC_FOOTPRINTS.map((footprint) => footprint.id)).size).toBe(140);

  const audit = auditMainBlockGeography();
  expect(audit.blockCount).toBe(140);
  expect(audit.uniqueIdCount).toBe(140);
  expect(audit.uniqueRowColumnCount).toBe(140);
  expect(audit.everyBlockInsideDomain).toBe(true);
  expect(audit.everyCenterResolvesToSelf).toBe(true);
  expect(audit.outerCornersCovered).toBe(true);
  expect(audit.coveredAreaDegreesSquared).toBe(audit.expectedDomainAreaDegreesSquared);
  expect(audit.expectedDomainAreaDegreesSquared).toBe(800);
  expect(() => assertCanonicalMainBlockGeography()).not.toThrow();

  for (const block of INDIAN_OCEAN_MAIN_BLOCKS) {
    const footprint = geographicFootprintById(block.id);
    expect(footprint).not.toBeNull();
    expect(footprint!.row).toBe(block.row);
    expect(footprint!.column).toBe(block.column);
    expect(footprint!.bounds).toEqual({
      west: block.west,
      east: block.east,
      south: block.south,
      north: block.north
    });
    expect(footprint!.polygon[0]).toEqual(footprint!.polygon[4]);
    expect(findGeographicMainBlockAt(footprint!.center.longitude, footprint!.center.latitude)?.id).toBe(block.id);
  }
});

test("3DB-03 assigns shared geographic edges to exactly one deterministic block", () => {
  expect(MAIN_BLOCK_POINT_OWNERSHIP.longitude).toContain("east-exclusive");
  expect(MAIN_BLOCK_POINT_OWNERSHIP.latitude).toContain("south-exclusive");

  // 63°E is the shared edge between IO-001 and IO-002: eastward cell owns it.
  expect(findGeographicMainBlockAt(63, 24)?.id).toBe("IO-002");
  // 23°N is the shared edge between row 0 and row 1: southern row owns it.
  expect(findGeographicMainBlockAt(61, 23)?.id).toBe("IO-015");
  // Intersection of both shared edges resolves once, to row 1 / column 1.
  expect(findGeographicMainBlockAt(63, 23)?.id).toBe("IO-016");

  // All outer boundaries remain owned by the outermost cells.
  expect(findGeographicMainBlockAt(60, 25)?.id).toBe("IO-001");
  expect(findGeographicMainBlockAt(100, 25)?.id).toBe("IO-014");
  expect(findGeographicMainBlockAt(60, 5)?.id).toBe("IO-127");
  expect(findGeographicMainBlockAt(100, 5)?.id).toBe("IO-140");

  // The public runtime selector delegates to exactly the same geographic contract.
  expect(findTargetBlockAt(63, 23)?.id).toBe("IO-016");
});

test("3DB-03 fails closed outside the target domain", () => {
  expect(isCoordinateInMainBlockDomain(TARGET_DOMAIN.west, TARGET_DOMAIN.south)).toBe(true);
  expect(isCoordinateInMainBlockDomain(TARGET_DOMAIN.east, TARGET_DOMAIN.north)).toBe(true);

  for (const [longitude, latitude] of [
    [59.999, 15],
    [100.001, 15],
    [80, 4.999],
    [80, 25.001],
    [Number.NaN, 15],
    [80, Number.POSITIVE_INFINITY]
  ] as Array<[number, number]>) {
    expect(isCoordinateInMainBlockDomain(longitude, latitude)).toBe(false);
    expect(findGeographicMainBlockAt(longitude, latitude)).toBeNull();
    expect(findTargetBlockAt(longitude, latitude)).toBeNull();
  }
});

test("3DB-03 geographic hardening does not promote or fabricate scientific evidence", () => {
  expect(PHASE35B_PILOT_IDS).toHaveLength(35);
  expect(PHASE35B_MULTI_DATE_PILOT_IDS).toHaveLength(6);

  const materialized = INDIAN_OCEAN_MAIN_BLOCKS
    .map((block) => resolveMainBlock(block.id))
    .filter((block) => block.materialization === "pilot");
  const planned = INDIAN_OCEAN_MAIN_BLOCKS
    .map((block) => resolveMainBlock(block.id))
    .filter((block) => block.materialization === "planned");

  expect(materialized).toHaveLength(35);
  expect(planned).toHaveLength(105);
  for (const block of planned) {
    expect(block.availableDates).toEqual([]);
    expect(block.nativeTimesUtc).toEqual([]);
  }
});
