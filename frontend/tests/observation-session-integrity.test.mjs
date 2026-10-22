import assert from "node:assert/strict";
import test from "node:test";
import {
  IMPORTED_OBSERVATIONS_KEY,
  groupImportedObservationProfiles,
  readImportedObservationRecords,
  sanitizeImportedObservationRecords,
  writeImportedObservationRecords
} from "../src/observationSession.ts";

const ORIGINAL = Object.freeze({
  longitude: 68.25, latitude: 13.25, depth_m: 30,
  timestamp: "2024-01-02T00:00:00Z", variable: "temperature",
  value: 28.2, units: "degree_Celsius", source: "Argo_GDAC",
  platform_id: "5907092", sensor_type: "argo",
  qc_flag: "1", dataset_id: "verified_argo"
});
const scan = (change = {}) => sanitizeImportedObservationRecords([{ ...ORIGINAL, ...change }]);

test("source defect fingerprint: Number(null), Number(empty), Number(false) all fabricate numeric zero", () => {
  for (const val of [null, "", " ", false, []]) {
    assert.equal(Number(val), 0);
    assert.equal(Number.isFinite(Number(val)), true);
  }
});

for (const field of ["longitude", "latitude", "depth_m", "value"]) {
  test("reject absent or coerced nonmeasurements in " + field, () => {
    for (const absent of [null, undefined, "", " ", "  ", false, true, [], [0], {}]) {
      assert.equal(scan({ [field]: absent }).length, 0, String(absent));
    }
  });
  test("reject malformed numerical representations in " + field, () => {
    for (const invalid of [NaN, Infinity, -Infinity, "NaN", "Infinity", "-Infinity", "0x10", "1_000", "1,000", "1e", "-", ".", "0b10"]) {
      assert.equal(scan({ [field]: invalid }).length, 0, String(invalid));
    }
  });
}

test("preserve measured numeric zero for positions, depth and physical values", () => {
  const a = scan({ longitude: 0, latitude: 0, depth_m: 0, value: 0 });
  assert.equal(a.length, 1);
  for (const name of ["longitude", "latitude", "depth_m", "value"]) assert.equal(a[0][name], 0);
});

test("preserve valid signed decimal, scientific notation and whitespace handling", () => {
  const a = scan({ longitude: "+6.825e1", latitude: " 1.325e1 ", depth_m: ".3e2", value: "-2.5E-1" });
  assert.equal(a.length, 1);
  assert.deepEqual([a[0].longitude, a[0].latitude, a[0].depth_m, a[0].value], [68.25, 13.25, 30, -0.25]);
});

test("retain Argo identity, metadata, original units, QC and UTC timestamp", () => {
  const a = scan();
  assert.equal(a.length, 1);
  for (const name of ["source", "platform_id", "units", "variable", "dataset_id", "qc_flag"]) assert.equal(a[0][name], ORIGINAL[name]);
  assert.equal(a[0].timestamp, "2024-01-02T00:00:00.000Z");
  assert.equal(a[0].value, 28.2);
});

test("reject out-of-range coordinates and negative positive-down depths", () => {
  for (const invalid of [{longitude:180.001},{longitude:-180.001},{latitude:90.001},{latitude:-90.001},{depth_m:-0.1}]) {
    assert.equal(scan(invalid).length, 0);
  }
});

test("reject corrupted historical session samples and persist only real records", () => {
  const stored = new Map();
  const originalWindow = globalThis.window;
  const mixed = [{...ORIGINAL,value:null},{...ORIGINAL,value:0}];
  stored.set(IMPORTED_OBSERVATIONS_KEY, JSON.stringify(mixed));
  globalThis.window = {
    sessionStorage: {
      getItem: key => stored.get(key) ?? null,
      setItem: (key,value) => stored.set(key,value),
      removeItem: key => stored.delete(key)
    },
    dispatchEvent: () => true
  };
  try {
    assert.deepEqual(readImportedObservationRecords().map(x=>x.value), [0]);
    writeImportedObservationRecords(mixed);
    assert.deepEqual(JSON.parse(stored.get(IMPORTED_OBSERVATIONS_KEY)).map(x=>x.value), [0]);
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});

test("group native sensor profile without modifying depth, values, or source", () => {
  const records = sanitizeImportedObservationRecords([
    {...ORIGINAL,depth_m:0,value:0},
    {...ORIGINAL,depth_m:30,value:28.2}
  ]);
  const grouped = groupImportedObservationProfiles(records);
  assert.equal(grouped.length, 1);
  assert.deepEqual(grouped[0].records.map(x=>x.depth_m), [0,30]);
  assert.deepEqual(grouped[0].records.map(x=>x.value), [0,28.2]);
  assert.equal(grouped[0].source, "Argo_GDAC");
});
