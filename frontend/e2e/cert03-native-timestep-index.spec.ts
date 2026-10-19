import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import {
  pilotBlockField, pilotBlockVolume, pilotBlockCurrents, pilotBlockCurrentsVolume,
  type PilotBlockPayload
} from "../src/pilot-main-block-loader";
import { matchesGeographicPayload, matchesWaterColumnPayload, type LinkedViewSelection } from "../src/linked-view-integrity";

/** Regression for CERT-03 actual July 2004 pilot frame mismatch. */
const readNative = (date: string) =>
  JSON.parse(readFileSync(new URL("../public/main-blocks/data/IO-001/"+date+".json",import.meta.url),"utf8")) as PilotBlockPayload;

test("CERT-03 second genuine source timestep has native index 1 in every scientific renderer response",()=>{
  const july=readNative("2004-07-28"), march=readNative("2004-03-15");
  expect(march.time).toMatch(/^2004-03-15T/);
  expect(july.time).toMatch(/^2004-07-28T/);
  const depthIndex=18;
  const selection:LinkedViewSelection={
    sourceId:july.source.dataset_id, mainBlockId:"IO-001",mainBlockRevision:1,
    variable:"thetao",timeIndex:1,time:july.time,depthIndex,depthM:july.coordinates.depth_m[depthIndex]
  };
  const geo=pilotBlockField(july,"thetao",depthIndex,1);
  const water=pilotBlockVolume(july,"thetao",1);
  expect(geo.time_index).toBe(1);
  expect(water.time_index).toBe(1);
  expect(matchesGeographicPayload(geo,selection)).toBe(true);
  expect(matchesWaterColumnPayload(water,selection)).toBe(true);
  const marchGeo=pilotBlockField(march,"thetao",depthIndex,0);
  expect(matchesGeographicPayload(marchGeo,selection)).toBe(false);
  const current= {...selection,variable:"currents"};
  const u=pilotBlockCurrents(july,depthIndex,1);
  const uv=pilotBlockCurrentsVolume(july,1);
  expect(u.time_index).toBe(1);
  expect(uv.time_index).toBe(1);
  expect(uv.vertical_component_available).toBe(false);
  expect(matchesGeographicPayload(u,current)).toBe(true);
  expect(matchesWaterColumnPayload(uv,current)).toBe(true);
});
