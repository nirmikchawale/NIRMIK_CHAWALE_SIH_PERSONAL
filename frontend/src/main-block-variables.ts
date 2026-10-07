import type { ScientificMainBlock } from "./main-block-capabilities";

export const MAIN_BLOCK_MULTI_VARIABLE_INTEGRATION_VERSION = "3db-08-v1";

export type MainBlockScientificVariable = "thetao" | "so" | "currents";
export type MainBlockSourceComponent = "thetao" | "so" | "uo" | "vo";

export interface NativeVariableComponentEvidence {
  units: string;
  values: readonly (number | null)[];
  finite_count?: number;
  minimum?: number | null;
  maximum?: number | null;
}

export interface NativeVariableEvidence {
  shape: {
    depth: number;
    latitude: number;
    longitude: number;
  };
  variables: Partial<Record<MainBlockSourceComponent, NativeVariableComponentEvidence>>;
}

export interface ReadyMainBlockVariableIntegration {
  version: typeof MAIN_BLOCK_MULTI_VARIABLE_INTEGRATION_VERSION;
  blockId: string;
  materialization: Exclude<ScientificMainBlock["materialization"], "planned">;
  mode: "native-multi-variable";
  ready: true;
  resolution: "verified-registry" | "payload-resolved";
  availableVariables: readonly MainBlockScientificVariable[];
  sourceComponents: readonly MainBlockSourceComponent[];
  horizontalCurrentOnly: true;
}

export interface LockedMainBlockVariableIntegration {
  version: typeof MAIN_BLOCK_MULTI_VARIABLE_INTEGRATION_VERSION;
  blockId: string;
  materialization: "planned";
  mode: "locked";
  ready: false;
  resolution: "unavailable";
  availableVariables: readonly [];
  sourceComponents: readonly [];
  horizontalCurrentOnly: true;
}

export type MainBlockVariableIntegration =
  | ReadyMainBlockVariableIntegration
  | LockedMainBlockVariableIntegration;

const SUPPORTED_SOURCE_COMPONENTS = new Set<MainBlockSourceComponent>(["thetao", "so", "uo", "vo"]);
const RANGE_EPSILON = 1e-9;

function expectedSampleCount(blockId: string, evidence: NativeVariableEvidence): number {
  const { depth, latitude, longitude } = evidence.shape;
  for (const [name, value] of Object.entries({ depth, latitude, longitude })) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`3DB-08 variable contract: ${blockId} shape.${name} must be a positive integer.`);
    }
  }
  return depth * latitude * longitude;
}

function validateComponent(
  blockId: string,
  componentName: MainBlockSourceComponent,
  component: NativeVariableComponentEvidence,
  sampleCount: number
): { finiteCount: number; minimum: number | null; maximum: number | null } {
  if (typeof component.units !== "string" || component.units.trim().length === 0) {
    throw new Error(`3DB-08 variable contract: ${blockId} ${componentName} requires source units.`);
  }
  if (!Array.isArray(component.values) || component.values.length !== sampleCount) {
    throw new Error(
      `3DB-08 variable contract: ${blockId} ${componentName} exposes ${component.values?.length ?? 0} values; expected ${sampleCount} from the native source shape.`
    );
  }

  const finite: number[] = [];
  for (let index = 0; index < component.values.length; index += 1) {
    const value = component.values[index];
    if (value === null) continue;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(
        `3DB-08 variable contract: ${blockId} ${componentName}[${index}] must be a finite source value or null land fill.`
      );
    }
    finite.push(value);
  }

  if (component.finite_count != null && component.finite_count !== finite.length) {
    throw new Error(
      `3DB-08 variable contract: ${blockId} ${componentName} finite_count ${component.finite_count} does not match ${finite.length} finite source samples.`
    );
  }

  const minimum = finite.length ? Math.min(...finite) : null;
  const maximum = finite.length ? Math.max(...finite) : null;
  if (finite.length === 0) {
    if (component.minimum != null || component.maximum != null) {
      throw new Error(
        `3DB-08 variable contract: ${blockId} ${componentName} has no finite source values but publishes a numeric range.`
      );
    }
  } else {
    if (
      component.minimum == null ||
      component.maximum == null ||
      Math.abs(component.minimum - minimum!) > RANGE_EPSILON ||
      Math.abs(component.maximum - maximum!) > RANGE_EPSILON
    ) {
      throw new Error(
        `3DB-08 variable contract: ${blockId} ${componentName} source minimum/maximum do not match the retained finite values.`
      );
    }
  }

  return { finiteCount: finite.length, minimum, maximum };
}

export function assertNativeVariableEvidence(
  blockId: string,
  evidence: NativeVariableEvidence
): {
  availableVariables: readonly MainBlockScientificVariable[];
  sourceComponents: readonly MainBlockSourceComponent[];
} {
  const sampleCount = expectedSampleCount(blockId, evidence);
  const sourceComponents = Object.keys(evidence.variables) as string[];
  const unsupported = sourceComponents.filter(
    (name) => !SUPPORTED_SOURCE_COMPONENTS.has(name as MainBlockSourceComponent)
  );
  if (unsupported.length) {
    throw new Error(
      `3DB-08 variable contract: ${blockId} contains unsupported main-block source component(s): ${unsupported.join(", ")}.`
    );
  }

  const componentStats = new Map<MainBlockSourceComponent, { finiteCount: number }>();
  for (const componentName of sourceComponents as MainBlockSourceComponent[]) {
    const component = evidence.variables[componentName];
    if (!component) continue;
    componentStats.set(
      componentName,
      validateComponent(blockId, componentName, component, sampleCount)
    );
  }

  const availableVariables: MainBlockScientificVariable[] = [];
  if ((componentStats.get("thetao")?.finiteCount ?? 0) > 0) availableVariables.push("thetao");
  if ((componentStats.get("so")?.finiteCount ?? 0) > 0) availableVariables.push("so");

  const u = evidence.variables.uo;
  const v = evidence.variables.vo;
  if ((u && !v) || (!u && v)) {
    throw new Error(
      `3DB-08 variable contract: ${blockId} currents require both native uo and vo components.`
    );
  }
  if (u && v) {
    if (u.units.trim() !== v.units.trim()) {
      throw new Error(
        `3DB-08 variable contract: ${blockId} native uo/vo units must match before horizontal speed is derived.`
      );
    }
    let pairedFinite = 0;
    for (let index = 0; index < sampleCount; index += 1) {
      const uValue = u.values[index];
      const vValue = v.values[index];
      if (
        typeof uValue === "number" &&
        Number.isFinite(uValue) &&
        typeof vValue === "number" &&
        Number.isFinite(vValue)
      ) {
        pairedFinite += 1;
      }
    }
    if (pairedFinite > 0) availableVariables.push("currents");
  }

  return {
    availableVariables,
    sourceComponents: sourceComponents as MainBlockSourceComponent[]
  };
}

export function deriveMainBlockVariableIntegration(
  block: ScientificMainBlock,
  evidence?: NativeVariableEvidence
): MainBlockVariableIntegration {
  if (block.materialization === "planned") {
    if (evidence && Object.keys(evidence.variables).length > 0) {
      throw new Error(
        `3DB-08 variable contract: planned block ${block.id} cannot receive scientific variable evidence.`
      );
    }
    return {
      version: MAIN_BLOCK_MULTI_VARIABLE_INTEGRATION_VERSION,
      blockId: block.id,
      materialization: "planned",
      mode: "locked",
      ready: false,
      resolution: "unavailable",
      availableVariables: [],
      sourceComponents: [],
      horizontalCurrentOnly: true
    };
  }

  if (block.materialization === "verified-baseline") {
    const availableVariables = [...block.variables] as MainBlockScientificVariable[];
    return {
      version: MAIN_BLOCK_MULTI_VARIABLE_INTEGRATION_VERSION,
      blockId: block.id,
      materialization: "verified-baseline",
      mode: "native-multi-variable",
      ready: true,
      resolution: "verified-registry",
      availableVariables,
      sourceComponents: ["thetao", "so", "uo", "vo"],
      horizontalCurrentOnly: true
    };
  }

  if (!evidence) {
    throw new Error(
      `3DB-08 variable contract: materialized pilot ${block.id} requires genuine native variable evidence.`
    );
  }

  const validated = assertNativeVariableEvidence(block.id, evidence);
  for (const variable of block.variables) {
    if (!validated.availableVariables.includes(variable)) {
      throw new Error(
        `3DB-08 variable contract: ${block.id} declares ${variable} but the retained source payload cannot support it.`
      );
    }
  }

  return {
    version: MAIN_BLOCK_MULTI_VARIABLE_INTEGRATION_VERSION,
    blockId: block.id,
    materialization: "pilot",
    mode: "native-multi-variable",
    ready: true,
    resolution: "payload-resolved",
    availableVariables: validated.availableVariables,
    sourceComponents: validated.sourceComponents,
    horizontalCurrentOnly: true
  };
}

export function assertMainBlockVariableSelection(
  integration: MainBlockVariableIntegration,
  variable: string
): MainBlockScientificVariable {
  if (variable !== "thetao" && variable !== "so" && variable !== "currents") {
    throw new Error(
      `3DB-08 variable contract: unsupported main-block scientific variable ${variable}.`
    );
  }
  if (!integration.ready || !integration.availableVariables.includes(variable)) {
    throw new Error(
      `3DB-08 variable contract: ${variable} is unavailable for ${integration.blockId}.`
    );
  }
  return variable;
}
