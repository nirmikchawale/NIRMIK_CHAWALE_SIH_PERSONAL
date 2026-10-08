import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { api, resolveServiceUrl } from "../api";
import { DataLabDirectoryNav } from "../components/DataLabDirectoryNav";
import { parseBrowserNetcdf, type NetcdfBrowserInspection } from "../netcdfImport";
import { writeImportedObservationRecords } from "../observationSession";
import type {
  ConnectorRegistryResponse,
  ImportedObservationRecord,
  ImportedSensorType
} from "../types";

const REQUIRED_FIELDS = [
  "longitude",
  "latitude",
  "depth_m",
  "timestamp",
  "variable",
  "value",
  "units",
  "source"
] as const;

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_NETCDF_FILE_BYTES = 32 * 1024 * 1024;
const MAX_RECORDS = 100_000;
const MAX_TEXT_LENGTH = 256;
const EXPLICIT_TIMEZONE = /(?:Z|[+-]\d{2}:\d{2})$/i;

type OfficialSourceKind = "model" | "float" | "india";

const OFFICIAL_DATA_SOURCES: Array<{
  kind: OfficialSourceKind;
  provider: string;
  title: string;
  role: string;
  nativeFormat: string;
  variables: string[];
  url: string;
}> = [
  {
    kind: "model",
    provider: "COPERNICUS MARINE",
    title: "GLORYS12V1 global ocean physics reanalysis",
    role: "Model temperature, salinity and horizontal currents with depth-aware gridded context.",
    nativeFormat: "Native delivery: NetCDF / service subset",
    variables: ["temperature", "salinity", "eastward velocity", "northward velocity"],
    url: "https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_PHY_001_030/description"
  },
  {
    kind: "float",
    provider: "ARGO GDAC · IFREMER",
    title: "Argo global profiling-float observations",
    role: "Observed vertical profiles for model–observation comparison and depth-resolved evidence.",
    nativeFormat: "Native delivery: Argo NetCDF",
    variables: ["pressure/depth", "temperature", "salinity", "QC metadata"],
    url: "https://data-argo.ifremer.fr/"
  },
  {
    kind: "india",
    provider: "INCOIS LAS",
    title: "Indian Ocean official data access portal",
    role: "Regional ocean-data discovery and subsetting for Indian Ocean scientific context.",
    nativeFormat: "Portal subset/export formats vary by dataset",
    variables: ["ocean fields", "coordinates", "depth/time", "source metadata"],
    url: "https://las.incois.gov.in/las/UI.vm"
  }
];

function OfficialSourceIcon({ kind }: { kind: OfficialSourceKind }) {
  if (kind === "model") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="11" />
        <path d="M5 16h22M16 5c4 4 6 7.6 6 11s-2 7-6 11M16 5c-4 4-6 7.6-6 11s2 7 6 11" />
        <path d="M8 11c5 2 11 2 16 0M8 21c5-2 11-2 16 0" />
      </svg>
    );
  }
  if (kind === "float") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 4v18M12 8h8M12 22h8" />
        <path d="M8 25c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
        <circle cx="16" cy="7" r="3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7 6h18v20H7zM11 10h10M11 15h10M11 20h6" />
      <path d="M22 19l4 4-4 4M26 23h-7" />
    </svg>
  );
}

type RequiredField = (typeof REQUIRED_FIELDS)[number];
type Severity = "error" | "warning";

interface Issue {
  row: number | null;
  field?: string;
  severity: Severity;
  message: string;
}

interface NormalizedRecord {
  row: number;
  longitude: number;
  latitude: number;
  depth_m: number;
  timestamp: string;
  variable: string;
  value: number;
  units: string;
  source: string;
  platform_id?: string;
  qc_flag?: string;
  dataset_id?: string;
  sensor_type: ImportedSensorType;
}

interface VariableSummary {
  variable: string;
  rows: number;
  minimum: number;
  maximum: number;
  mean: number;
  units: string[];
}

interface ValidationResult {
  filename: string;
  format: "csv" | "json" | "netcdf";
  status: "validated" | "rejected";
  totalRows: number;
  validRows: number;
  invalidRows: number;
  issues: Issue[];
  records: NormalizedRecord[];
  variables: VariableSummary[];
  timestamps: string[];
  missingness: Record<RequiredField, number>;
  spatial: {
    longitudeMin: number | null;
    longitudeMax: number | null;
    latitudeMin: number | null;
    latitudeMax: number | null;
    depthMin: number | null;
    depthMax: number | null;
  };
}

function textValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function canonicalizeRecord(record: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    let canonical = key.trim().toLowerCase();
    if (canonical === "instrument_type" || canonical === "platform_type") canonical = "sensor_type";
    if (canonical && !(canonical in normalized)) normalized[canonical] = value;
  }
  return normalized;
}

function sensorTypeValue(value: unknown): ImportedSensorType {
  const normalized = textValue(value).toLowerCase();
  return normalized === "argo" || normalized === "glider" || normalized === "ctd" || normalized === "bgc"
    ? normalized
    : "other";
}

function parseDelimited(text: string, delimiter = ","): Array<Record<string, unknown>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      if (field.length !== 0) throw new Error("Malformed delimited text: quote begins inside an unquoted field.");
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (quoted) throw new Error("Malformed delimited text: quoted field is not closed.");
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonBlank = rows.filter((item) => item.some((cell) => cell.trim() !== ""));
  if (nonBlank.length < 2) throw new Error("Delimited text must include a header and at least one data row.");

  const headers = nonBlank[0].map((cell, index) => {
    const clean = cell.replace(/^\uFEFF/, "").trim().toLowerCase();
    if (!clean) throw new Error(`Delimited-text header ${index + 1} is empty.`);
    return clean;
  });
  if (new Set(headers).size !== headers.length) throw new Error("Delimited text contains duplicate column names.");

  return nonBlank.slice(1).map((cells) => {
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      record[header] = (cells[index] ?? "").trim();
    });
    return record;
  });
}

function parseJson(text: string): Array<Record<string, unknown>> {
  const payload: unknown = JSON.parse(text);
  const candidate =
    Array.isArray(payload)
      ? payload
      : payload && typeof payload === "object" && Array.isArray((payload as { records?: unknown }).records)
        ? (payload as { records: unknown[] }).records
        : null;

  if (!candidate) throw new Error('JSON must be an array of records or an object with a "records" array.');
  if (candidate.length === 0) throw new Error("JSON must contain at least one record.");

  return candidate.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`JSON record ${index + 1} must be an object.`);
    }
    return canonicalizeRecord(item as Record<string, unknown>);
  });
}

function numberValue(value: unknown): number | null {
  const text = textValue(value);
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateRecords(
  filename: string,
  format: "csv" | "json" | "netcdf",
  rawRecords: Array<Record<string, unknown>>
): ValidationResult {
  if (rawRecords.length > MAX_RECORDS) {
    throw new Error(`Dataset has ${rawRecords.length.toLocaleString()} rows; the browser validation limit is ${MAX_RECORDS.toLocaleString()}.`);
  }

  const records = rawRecords.map(canonicalizeRecord);
  const issues: Issue[] = [];
  const normalized: NormalizedRecord[] = [];
  const missingness = Object.fromEntries(REQUIRED_FIELDS.map((field) => [field, 0])) as Record<RequiredField, number>;

  const available = new Set(records.flatMap((record) => Object.keys(record)));
  for (const field of REQUIRED_FIELDS) {
    if (!available.has(field)) {
      issues.push({
        row: null,
        field,
        severity: "error",
        message: `Required column "${field}" is missing from the dataset.`
      });
    }
  }

  records.forEach((record, index) => {
    const rowNumber = index + 1;
    let rowValid = true;

    for (const field of REQUIRED_FIELDS) {
      if (textValue(record[field]) === "") {
        missingness[field] += 1;
        issues.push({
          row: rowNumber,
          field,
          severity: "error",
          message: `${field === "units" ? "Units are" : field === "source" ? "Source provenance is" : `${field} is`} required.`
        });
        rowValid = false;
      }
    }

    const longitude = numberValue(record.longitude);
    const latitude = numberValue(record.latitude);
    const depth = numberValue(record.depth_m);
    const value = numberValue(record.value);
    const timestampText = textValue(record.timestamp);
    const variable = textValue(record.variable);
    const units = textValue(record.units);
    const source = textValue(record.source);

    if (longitude == null) {
      if (textValue(record.longitude)) {
        issues.push({ row: rowNumber, field: "longitude", severity: "error", message: "Longitude must be a finite number." });
        rowValid = false;
      }
    } else if (longitude < -180 || longitude > 180) {
      issues.push({ row: rowNumber, field: "longitude", severity: "error", message: "Longitude must be between -180 and 180 degrees." });
      rowValid = false;
    }

    if (latitude == null) {
      if (textValue(record.latitude)) {
        issues.push({ row: rowNumber, field: "latitude", severity: "error", message: "Latitude must be a finite number." });
        rowValid = false;
      }
    } else if (latitude < -90 || latitude > 90) {
      issues.push({ row: rowNumber, field: "latitude", severity: "error", message: "Latitude must be between -90 and 90 degrees." });
      rowValid = false;
    }

    if (depth == null) {
      if (textValue(record.depth_m)) {
        issues.push({ row: rowNumber, field: "depth_m", severity: "error", message: "Depth must be a finite number in metres." });
        rowValid = false;
      }
    } else if (depth < 0 || depth > 12_000) {
      issues.push({ row: rowNumber, field: "depth_m", severity: "error", message: "Depth must be between 0 and 12,000 m, positive downward." });
      rowValid = false;
    }

    if (value == null && textValue(record.value)) {
      issues.push({ row: rowNumber, field: "value", severity: "error", message: "Value must be a finite number." });
      rowValid = false;
    }

    if (timestampText) {
      if (!EXPLICIT_TIMEZONE.test(timestampText)) {
        issues.push({
          row: rowNumber,
          field: "timestamp",
          severity: "error",
          message: "Timestamp must include an explicit timezone (Z or ±HH:MM)."
        });
        rowValid = false;
      } else if (!Number.isFinite(Date.parse(timestampText))) {
        issues.push({ row: rowNumber, field: "timestamp", severity: "error", message: "Timestamp is not a valid ISO-style date/time." });
        rowValid = false;
      }
    }

    for (const [field, text] of [["variable", variable], ["units", units], ["source", source]] as const) {
      if (text.length > MAX_TEXT_LENGTH) {
        issues.push({ row: rowNumber, field, severity: "error", message: `${field} exceeds the ${MAX_TEXT_LENGTH}-character validation limit.` });
        rowValid = false;
      }
    }

    if (
      rowValid &&
      longitude != null &&
      latitude != null &&
      depth != null &&
      value != null &&
      timestampText &&
      variable &&
      units &&
      source
    ) {
      normalized.push({
        row: rowNumber,
        longitude,
        latitude,
        depth_m: depth,
        timestamp: new Date(timestampText).toISOString(),
        variable,
        value,
        units,
        source,
        platform_id: textValue(record.platform_id) || undefined,
        qc_flag: textValue(record.qc_flag) || undefined,
        dataset_id: textValue(record.dataset_id) || undefined,
        sensor_type: sensorTypeValue(record.sensor_type)
      });
    }
  });

  const duplicateKeys = new Map<string, number>();
  for (const record of normalized) {
    const key = [
      record.longitude,
      record.latitude,
      record.depth_m,
      record.timestamp,
      record.variable
    ].join("|");
    duplicateKeys.set(key, (duplicateKeys.get(key) ?? 0) + 1);
  }
  const duplicates = [...duplicateKeys.values()].filter((count) => count > 1).reduce((sum, count) => sum + count - 1, 0);
  if (duplicates > 0) {
    issues.push({
      row: null,
      severity: "warning",
      message: `${duplicates} duplicate measurement key${duplicates === 1 ? "" : "s"} detected (lon/lat/depth/time/variable).`
    });
  }

  const unitsByVariable = new Map<string, Set<string>>();
  for (const record of normalized) {
    const set = unitsByVariable.get(record.variable) ?? new Set<string>();
    set.add(record.units);
    unitsByVariable.set(record.variable, set);
  }
  for (const [variable, units] of unitsByVariable) {
    if (units.size > 1) {
      issues.push({
        row: null,
        severity: "warning",
        message: `Variable "${variable}" uses multiple unit strings: ${[...units].join(", ")}. Values are not converted automatically.`
      });
    }
  }

  const timestamps = [...new Set(normalized.map((record) => record.timestamp))].sort();
  if (normalized.length > 0 && timestamps.length === 1) {
    issues.push({
      row: null,
      severity: "warning",
      message: "Only one genuine timestamp is present; time-series analysis remains locked until additional real timestamps are supplied."
    });
  }

  const variableGroups = new Map<string, NormalizedRecord[]>();
  for (const record of normalized) {
    const group = variableGroups.get(record.variable) ?? [];
    group.push(record);
    variableGroups.set(record.variable, group);
  }
  const variables: VariableSummary[] = [...variableGroups.entries()].map(([variable, group]) => {
    const values = group.map((record) => record.value);
    return {
      variable,
      rows: group.length,
      minimum: Math.min(...values),
      maximum: Math.max(...values),
      mean: values.reduce((sum, value) => sum + value, 0) / values.length,
      units: [...new Set(group.map((record) => record.units))]
    };
  });

  const errorRows = new Set(
    issues.filter((issue) => issue.severity === "error" && issue.row != null).map((issue) => issue.row as number)
  );
  const hasGlobalError = issues.some((issue) => issue.severity === "error" && issue.row == null);
  const invalidRows = hasGlobalError ? records.length : errorRows.size;
  const validRows = Math.max(0, records.length - invalidRows);
  const longitudeValues = normalized.map((record) => record.longitude);
  const latitudeValues = normalized.map((record) => record.latitude);
  const depthValues = normalized.map((record) => record.depth_m);
  const extrema = (values: number[]) => values.length ? [Math.min(...values), Math.max(...values)] : [null, null] as const;
  const [longitudeMin, longitudeMax] = extrema(longitudeValues);
  const [latitudeMin, latitudeMax] = extrema(latitudeValues);
  const [depthMin, depthMax] = extrema(depthValues);

  return {
    filename,
    format,
    status: issues.some((issue) => issue.severity === "error") ? "rejected" : "validated",
    totalRows: records.length,
    validRows,
    invalidRows,
    issues,
    records: normalized,
    variables,
    timestamps,
    missingness,
    spatial: { longitudeMin, longitudeMax, latitudeMin, latitudeMax, depthMin, depthMax }
  };
}

function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function downloadSchema() {
  const text = [
    "longitude,latitude,depth_m,timestamp,variable,value,units,source,platform_id,sensor_type,qc_flag,dataset_id",
    "68.2500,13.2500,10.0,2020-07-01T00:00:00Z,temperature,28.2,degree_Celsius,example_source,platform_001,glider,1,dataset_name"
  ].join("\n");
  downloadText("OceanCanvas_data_lab_schema.csv", text, "text/csv;charset=utf-8");
}

function downloadReport(result: ValidationResult) {
  const report = {
    exported_by: "Ocean Canvas · Data Lab",
    processed_locally: true,
    filename: result.filename,
    format: result.format,
    status: result.status,
    rows: {
      total: result.totalRows,
      valid: result.validRows,
      invalid: result.invalidRows
    },
    variables: result.variables,
    genuine_timestamps: result.timestamps,
    missingness: result.missingness,
    spatial_extent: result.spatial,
    issues: result.issues,
    normalized_preview: result.records.slice(0, 25)
  };
  downloadText(
    "OceanCanvas_validation_report.json",
    JSON.stringify(report, null, 2),
    "application/json;charset=utf-8"
  );
}


/** Only validated, locally inspected rows can be exported. Scientific values are never inferred. */
function downloadFilteredRecords(records: NormalizedRecord[], format: "csv" | "json", filename: string) {
  const fields: Array<keyof NormalizedRecord> = [
    "longitude", "latitude", "depth_m", "timestamp", "variable", "value", "units", "source",
    "platform_id", "sensor_type", "qc_flag", "dataset_id"
  ];
  const basename = filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 72) || "dataset";
  if (format === "json") {
    const exportPayload = {
      exported_by: "Ocean Canvas · Data Lab",
      processed_locally: true,
      source_filename: filename,
      exported_utc: new Date().toISOString(),
      filtered_validated_rows: records.length,
      records: records.map((record) => Object.fromEntries(fields.map((field) => [field, record[field] ?? null])))
    };
    downloadText("OceanCanvas_" + basename + "_filtered.json", JSON.stringify(exportPayload, null, 2), "application/json;charset=utf-8");
    return;
  }
  const cell = (value: unknown) => {
    const raw = value == null ? "" : String(value);
    // Spreadsheet formula injection: do not permit untrusted *text* to execute as a formula.
    const safe = typeof value === "string" && /^\s*[=+\-@]/.test(raw) ? "'" + raw : raw;
    return '"' + safe.replace(/"/g, '""') + '"';
  };
  const csv = [fields.join(","), ...records.map((record) => fields.map((field) => cell(record[field])).join(","))].join("\r\n");
  downloadText("OceanCanvas_" + basename + "_filtered.csv", csv, "text/csv;charset=utf-8");
}

export function DataLabPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [processingError, setProcessingError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [netcdfInspection, setNetcdfInspection] = useState<NetcdfBrowserInspection | null>(null);
  const [connectorRegistry, setConnectorRegistry] = useState<ConnectorRegistryResponse | null>(null);
  const [connectorError, setConnectorError] = useState("");
  const [variableFilter, setVariableFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sensorFilter, setSensorFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [depthMinFilter, setDepthMinFilter] = useState("");
  const [depthMaxFilter, setDepthMaxFilter] = useState("");

  const resetFilters = () => {
    setVariableFilter("all");
    setSourceFilter("all");
    setSensorFilter("all");
    setTimeFilter("all");
    setDepthMinFilter("");
    setDepthMaxFilter("");
  };

  const filterOptions = useMemo(() => {
    const records = result?.records ?? [];
    const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));
    return {
      variables: unique(records.map((record) => record.variable)),
      sources: unique(records.map((record) => record.source)),
      sensors: unique(records.map((record) => record.sensor_type)),
      timestamps: unique(records.map((record) => record.timestamp))
    };
  }, [result]);

  const filteredRecords = useMemo(() => {
    if (!result) return [];
    const min = depthMinFilter.trim() === "" ? null : Number(depthMinFilter);
    const max = depthMaxFilter.trim() === "" ? null : Number(depthMaxFilter);
    return result.records.filter((record) =>
      (variableFilter === "all" || record.variable === variableFilter) &&
      (sourceFilter === "all" || record.source === sourceFilter) &&
      (sensorFilter === "all" || record.sensor_type === sensorFilter) &&
      (timeFilter === "all" || record.timestamp === timeFilter) &&
      (min === null || record.depth_m >= min) &&
      (max === null || record.depth_m <= max)
    );
  }, [result, variableFilter, sourceFilter, sensorFilter, timeFilter, depthMinFilter, depthMaxFilter]);

  const sourceNames = filterOptions.sources;
  const datasetIds = useMemo(
    () => [...new Set((result?.records ?? []).map((record) => record.dataset_id).filter((id): id is string => Boolean(id)))].sort(),
    [result]
  );
  const qcFlags = useMemo(
    () => [...new Set((result?.records ?? []).map((record) => record.qc_flag).filter((flag): flag is string => Boolean(flag)))].sort(),
    [result]
  );

  useEffect(() => {
    let cancelled = false;
    api.connectors()
      .then((payload) => {
        if (!cancelled) setConnectorRegistry(payload);
      })
      .catch((reason: Error) => {
        if (!cancelled) setConnectorError(reason.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const errorIssues = useMemo(
    () => result?.issues.filter((issue) => issue.severity === "error") ?? [],
    [result]
  );
  const warningIssues = useMemo(
    () => result?.issues.filter((issue) => issue.severity === "warning") ?? [],
    [result]
  );
  const missingFields = useMemo(
    () => result
      ? Object.entries(result.missingness).filter(([, count]) => count > 0)
      : [],
    [result]
  );

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    resetFilters();
    setProcessingError("");
    setResult(null);
    setNetcdfInspection(null);

    try {
      const extension = file.name.toLowerCase().split(".").pop();
      const netcdfFile = extension === "nc" || extension === "nc4" || extension === "cdf";
      const limit = netcdfFile ? MAX_NETCDF_FILE_BYTES : MAX_FILE_BYTES;
      if (file.size > limit) {
        throw new Error(
          `File is ${(file.size / (1024 * 1024)).toFixed(2)} MB; the local validation limit is ${netcdfFile ? 32 : 5} MB.`
        );
      }

      if (!extension || !["csv", "tsv", "txt", "asc", "json", "nc", "nc4", "cdf"].includes(extension)) {
        throw new Error("Unsupported file type. Use NetCDF (.nc/.nc4/.cdf), CSV, TSV/ASCII text, or JSON.");
      }

      if (netcdfFile) {
        const imported = await parseBrowserNetcdf(file);
        setNetcdfInspection(imported.inspection);
        if (imported.records.length === 0) {
          throw new Error(
            "NetCDF metadata was inspected successfully, but no safe CF-style observation profile could be converted. Review the NetCDF inspection panel for missing coordinate/time/depth metadata."
          );
        }
        setResult(validateRecords(file.name, "netcdf", imported.records));
      } else {
        const text = await file.text();
        if (!text.trim()) throw new Error("File is empty.");
        const format = extension === "json" ? "json" : "csv";
        const delimiter =
          extension === "tsv" ? "\t"
            : extension === "txt" || extension === "asc"
              ? (text.includes("\t") ? "\t" : text.includes(";") ? ";" : ",")
              : ",";
        const records = extension === "json" ? parseJson(text) : parseDelimited(text, delimiter);
        setResult(validateRecords(file.name, format, records));
      }
    } catch (reason) {
      setProcessingError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setProcessing(false);
    }
  };

  const clear = () => {
    resetFilters();
    setResult(null);
    setNetcdfInspection(null);
    setProcessingError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const loadIntoExplorer = () => {
    if (!result || result.status !== "validated" || result.records.length === 0) return;
    const visualRecords: ImportedObservationRecord[] = result.records
      .filter((record) => Boolean(record.platform_id))
      .map((record) => ({
        longitude: record.longitude,
        latitude: record.latitude,
        depth_m: record.depth_m,
        timestamp: record.timestamp,
        variable: record.variable,
        value: record.value,
        units: record.units,
        source: record.source,
        platform_id: record.platform_id as string,
        sensor_type: record.sensor_type,
        qc_flag: record.qc_flag,
        dataset_id: record.dataset_id
      }));
    if (visualRecords.length === 0) {
      setProcessingError("A platform_id is required to load validated rows as a 3D instrument profile.");
      return;
    }
    writeImportedObservationRecords(visualRecords);
    window.location.hash = "/explore";
  };

  return (
    <main
      className="data-lab-page"
      data-page="data-lab"
      data-validation-status={result?.status ?? "empty"}
      data-row-count={result?.totalRows ?? 0}
    >
      <DataLabDirectoryNav />
      <section id="data-lab-overview" data-data-lab-home="overview" className="data-lab-hero">
        <div>
          <div className="section-kicker">GUARDED USER DATA</div>
          <h2>Additional dataset lab</h2>
          <p>
            Validate a small ocean-observation NetCDF, CSV or JSON before analysis. Ocean Canvas checks
            CF-style coordinates, depth convention, timezone-aware timestamps, values, units, provenance,
            duplicates and missingness. It never guesses missing scientific metadata.
          </p>
          <button
            type="button"
            className="data-lab-jump"
            onClick={() => document.getElementById("data-lab-validator")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            Validate a file ↓
          </button>
        </div>
        <aside className="data-lab-privacy-card">
          <span>LOCAL PROCESSING</span>
          <strong>Data stays in this browser session</strong>
          <p>File bytes are parsed locally by this page and are not uploaded to an Ocean Canvas server.</p>
        </aside>
      </section>

      <div id="data-lab-sources" data-data-lab-home="sources">
      <section className="data-source-launchpad" aria-labelledby="official-data-launchpad-title">
        <div className="data-source-heading">
          <div>
            <div className="section-kicker">START WITH TRUSTED SOURCES</div>
            <h3 id="official-data-launchpad-title">Official data launchpad</h3>
            <p>
              Open a trusted ocean-data source, subset the measurements you need, then map them
              into Ocean Canvas&apos;s guarded CSV/JSON contract for local validation.
            </p>
          </div>
        </div>

        <div className="data-source-cards">
          {OFFICIAL_DATA_SOURCES.map((source) => (
            <article className="data-source-card" key={source.provider}>
              <div className="data-source-card-top">
                <div className={`data-source-icon ${source.kind}`}>
                  <OfficialSourceIcon kind={source.kind} />
                </div>
                <div>
                  <span>{source.provider}</span>
                  <h4>{source.title}</h4>
                </div>
              </div>
              <p>{source.role}</p>
              <div className="data-source-variable-list">
                {source.variables.map((variable) => <code key={variable}>{variable}</code>)}
              </div>
              <div className="data-source-native">{source.nativeFormat}</div>
              <div className="data-source-actions">
                <a href={source.url} target="_blank" rel="noreferrer">
                  Open official source <span aria-hidden="true">↗</span>
                </a>
                <span>Map → lon · lat · depth · time · variable · value · units · source</span>
              </div>
            </article>
          ))}
        </div>

        <div className="data-source-workflow" role="note">
          <strong>Safe import path</strong>
          <span>1 · Open official source</span>
          <span>2 · Subset/export genuine measurements</span>
          <span>3 · Reshape to Ocean Canvas schema</span>
          <span>4 · Validate locally before analysis</span>
        </div>
      </section>

      <section className="interoperability-panel" aria-labelledby="interoperability-title">
        <div className="data-source-heading">
          <div>
            <div className="section-kicker">OPEN-STANDARDS INTEROPERABILITY</div>
            <h3 id="interoperability-title">Registered source & protocol adapters</h3>
            <p>
              Ocean Canvas uses a discoverable adapter registry. Remote sources remain optional and fail closed;
              the bundled verified evidence is never silently replaced when a network service is unavailable.
            </p>
          </div>
          <span className="registry-status">
            {connectorRegistry
              ? connectorRegistry.connectors.length + " connectors"
              : connectorError
                ? "Registry unavailable"
                : "Loading registry…"}
          </span>
        </div>
        {connectorError && (
          <div className="data-lab-processing-error">
            <strong>Connector registry unavailable</strong>
            <span>{connectorError}</span>
          </div>
        )}
        {connectorRegistry && (
          <>
            <div className="connector-grid">
              {connectorRegistry.connectors.map((connector) => (
                <article className="connector-card" key={connector.id} data-runtime={connector.runtime}>
                  <div className="connector-card-heading">
                    <div>
                      <span>{connector.provider}</span>
                      <strong>{connector.title}</strong>
                    </div>
                    <code>{connector.adapter}</code>
                  </div>
                  <p>{connector.role}</p>
                  <div className="connector-badges">
                    {connector.protocols.map((protocol) => <span key={protocol}>{protocol}</span>)}
                  </div>
                  <div className="connector-badges standards">
                    {connector.standards.map((standard) => <span key={standard}>{standard}</span>)}
                  </div>
                  <small>{connector.variables.join(" · ")}</small>
                  <div className="connector-links">
                    {[
                      { label: "Provider metadata", url: connector.source_url },
                      { label: "OPeNDAP", url: connector.opendap_url },
                      { label: "WMS", url: connector.wms_url },
                      { label: "WCS", url: connector.wcs_url }
                    ]
                      .filter((link) => Boolean(link.url))
                      .map((link) => {
                        const href = resolveServiceUrl(link.url);
                        return href ? (
                          <a key={link.label} href={href} target="_blank" rel="noreferrer">{link.label} ↗</a>
                        ) : (
                          <span key={link.label} className="connector-link-unavailable" title="Served by the Ocean Canvas FastAPI backend; not available on the static public build.">
                            {link.label} · API deployment only
                          </span>
                        );
                      })}
                  </div>
                  {Boolean(connector.time_count || connector.depth_count) && (
                    <div className="connector-dimensions">
                      {connector.time_count && <span>{connector.time_count} times</span>}
                      {connector.depth_count && <span>{connector.depth_count} depths</span>}
                    </div>
                  )}
                </article>
              ))}
            </div>
            <div className="plugin-contract-grid">
              {Object.entries(connectorRegistry.plugin_contracts).map(([name, contract]) => (
                <article key={name}>
                  <code>{name}</code>
                  <strong>{contract.output}</strong>
                  <span>Input: {contract.input.join(", ")}</span>
                </article>
              ))}
            </div>
            <p className="interoperability-principle">{connectorRegistry.principle}</p>
          </>
        )}
      </section>
      </div>
            <section className="data-lab-grid" id="data-lab-validator" data-data-lab-home="datasets">
        <article className="data-lab-upload-card">
          <div className="data-lab-card-heading">
            <div>
              <span>1 · LOAD</span>
              <h3>NetCDF / CSV / TSV / ASCII / JSON validator</h3>
            </div>
          </div>
          <label className="data-lab-file-picker">
            <strong>{processing ? "Reading file…" : "Choose an ocean dataset"}</strong>
            <span>NetCDF up to 32 MB · text/JSON up to 5 MB · max 100,000 canonical records</span>
            <input
              ref={inputRef}
              aria-label="Ocean dataset file"
              type="file"
              accept=".nc,.nc4,.cdf,.csv,.tsv,.txt,.asc,.json,application/x-netcdf,application/netcdf,text/csv,text/tab-separated-values,text/plain,application/json"
              disabled={processing}
              onChange={handleFile}
            />
          </label>
          <div className="data-lab-schema">
            <span>Required fields</span>
            <div>
              {REQUIRED_FIELDS.map((field) => <code key={field}>{field}</code>)}
            </div>
            <p>
              NetCDF files are inspected in-browser for CF-style longitude, latitude, depth, time and profile-shaped variables. For canonical text imports, <code>depth_m</code> is metres positive downward. <code>timestamp</code> must include
              Z or an explicit UTC offset. Units are preserved as supplied; Ocean Canvas does not
              convert unknown unit strings.
            </p>
          </div>
          {processingError && (
            <div className="data-lab-processing-error" role="alert">
              <strong>File rejected before schema validation</strong>
              <span>{processingError}</span>
            </div>
          )}
        </article>

      </section>

      {!result && !processingError && (
        <section className="data-lab-empty">
          <div className="data-lab-empty-icon">DATA</div>
          <div>
            <strong>No user dataset loaded</strong>
            <span>Use the documented schema above. Validation begins locally after file selection.</span>
          </div>
        </section>
      )}


      {result && (
        <>
          <section className={`data-lab-status ${result.status === "validated" ? "valid" : "invalid"}`}>
            <div>
              <span>{result.status === "validated" ? "VALIDATED" : "REJECTED"}</span>
              <strong>{result.filename}</strong>
              <small>
                {result.status === "validated"
                  ? "Schema and required scientific checks passed. Eligible for downstream analysis."
                  : "One or more required scientific checks failed. Dataset is not eligible for analysis."}
              </small>
            </div>
            <div className="data-lab-status-actions">
              {result.status === "validated" && result.records.length > 0 && (
                <button type="button" className="primary" onClick={loadIntoExplorer}>
                  Load validated profiles into 3D Explorer
                </button>
              )}
              <button type="button" onClick={() => document.getElementById("data-lab-downloads")?.scrollIntoView({ behavior: "smooth", block: "start" })}>View downloads</button>
              <button type="button" onClick={clear}>Clear dataset</button>
            </div>
          </section>

          <section className="data-lab-metrics">
            <article><span>Total rows</span><strong>{result.totalRows.toLocaleString()}</strong></article>
            <article><span>Valid rows</span><strong>{result.validRows.toLocaleString()}</strong></article>
            <article><span>Invalid rows</span><strong>{result.invalidRows.toLocaleString()}</strong></article>
            <article><span>Variables</span><strong>{result.variables.length}</strong></article>
            <article><span>Genuine timestamps</span><strong>{result.timestamps.length}</strong></article>
            <article><span>Warnings</span><strong>{warningIssues.length}</strong></article>
          </section>

        </>
      )}

      <section id="data-lab-variables" data-data-lab-home="variables" className="data-lab-nav-section">
        <div className="data-lab-nav-heading">
          <div><span>VARIABLES</span><h3>Available measured variables</h3></div>
          <p>Numeric summaries use only rows passing scientific validation. No automatic unit conversion.</p>
        </div>
        {result ? (
          <>
          <section className="data-lab-result-card data-lab-variable-card">
            <div className="data-lab-card-heading">
              <div>
                <span>4 · VARIABLES</span>
                <h3>Validated numeric summaries</h3>
              </div>
              <small>Computed only from rows that pass required checks</small>
            </div>
            {result.variables.length === 0 ? (
              <div className="data-lab-inline-empty">No valid measurement rows are available for variable summaries.</div>
            ) : (
              <div className="data-lab-variable-grid">
                {result.variables.map((variable) => (
                  <article key={variable.variable}>
                    <span>{variable.variable}</span>
                    <strong>{variable.rows.toLocaleString()} rows</strong>
                    <dl>
                      <div><dt>Mean</dt><dd>{variable.mean.toFixed(5)}</dd></div>
                      <div><dt>Min</dt><dd>{variable.minimum.toFixed(5)}</dd></div>
                      <div><dt>Max</dt><dd>{variable.maximum.toFixed(5)}</dd></div>
                      <div><dt>Units</dt><dd>{variable.units.join(", ")}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>

          </>
        ) : <p className="data-lab-nav-empty">Load a dataset to inspect genuine measurement variables and units.</p>}
      </section>

      <section id="data-lab-filters" data-data-lab-home="filters" className="data-lab-nav-section" data-filtered-count={filteredRecords.length}>
        <div className="data-lab-nav-heading">
          <div><span>FILTERS</span><h3>Local validated-row filters</h3></div>
          <p>Scope the browser-inspected records; these controls do not query remote providers or alter source measurements.</p>
        </div>
        <div className="data-lab-filter-grid">
          <label>Variable
            <select aria-label="Filter variable" value={variableFilter} disabled={!result} onChange={(event) => setVariableFilter(event.target.value)}>
              <option value="all">All variables</option>
              {filterOptions.variables.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>Source
            <select aria-label="Filter source" value={sourceFilter} disabled={!result} onChange={(event) => setSourceFilter(event.target.value)}>
              <option value="all">All sources</option>
              {filterOptions.sources.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>Sensor
            <select aria-label="Filter sensor" value={sensorFilter} disabled={!result} onChange={(event) => setSensorFilter(event.target.value)}>
              <option value="all">All sensor types</option>
              {filterOptions.sensors.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>Genuine timestamp
            <select aria-label="Filter timestamp" value={timeFilter} disabled={!result} onChange={(event) => setTimeFilter(event.target.value)}>
              <option value="all">All timestamps</option>
              {filterOptions.timestamps.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>Minimum depth (m)
            <input aria-label="Minimum depth filter" type="number" min="0" max="12000" step="any" placeholder="Any" disabled={!result} value={depthMinFilter} onChange={(event) => setDepthMinFilter(event.target.value)} />
          </label>
          <label>Maximum depth (m)
            <input aria-label="Maximum depth filter" type="number" min="0" max="12000" step="any" placeholder="Any" disabled={!result} value={depthMaxFilter} onChange={(event) => setDepthMaxFilter(event.target.value)} />
          </label>
        </div>
        <div className="data-lab-filter-footer">
          <p role="status">{result ? filteredRecords.length.toLocaleString() + " / " + result.records.length.toLocaleString() + " accepted rows in current inspection scope" : "Load a dataset to activate local filters"}</p>
          <button type="button" disabled={!result} onClick={resetFilters}>Reset filters</button>
        </div>
        {result && result.status !== "validated" && <p className="data-lab-nav-warning">This dataset failed validation. Inspection of accepted rows is available; downstream import and filtered export remain disabled.</p>}
      </section>

      <section id="data-lab-inspection" data-data-lab-home="inspection" className="data-lab-nav-section">
        <div className="data-lab-nav-heading">
          <div><span>INSPECTION</span><h3>Quality, coverage and row-level evidence</h3></div>
          <p>Examine CF metadata, fail-closed validation rules, retained quality findings and the currently filtered preview.</p>
        </div>
        <article className="data-lab-policy-card">
          <div className="data-lab-card-heading">
            <div>
              <span>VALIDATION CONTRACT</span>
              <h3>Fail closed, not “best guess”</h3>
            </div>
          </div>
          <ul>
            <li>Longitude −180…180° and latitude −90…90°.</li>
            <li>Depth 0…12,000 m, positive downward.</li>
            <li>Finite numeric measurement values only.</li>
            <li>Timezone-aware timestamps only.</li>
            <li>Units and source provenance are mandatory.</li>
            <li>Duplicate keys and multi-unit variables are surfaced as warnings.</li>
          </ul>
          <p>Uploaded text is treated as untrusted data, never as instructions or executable content.</p>
        </article>
          {netcdfInspection && (
            <div className="netcdf-inspection-card" data-cf-profile-ready={netcdfInspection.cf_profile_ready ? "true" : "false"}>
              <div className="data-lab-card-heading">
                <div>
                  <span>NETCDF4 / CF INSPECTION</span>
                  <h3>{netcdfInspection.file_format} · {netcdfInspection.conventions || "Conventions not declared"}</h3>
                </div>
                <strong>{netcdfInspection.generated_profile_rows.toLocaleString()} canonical rows</strong>
              </div>
              <div className="netcdf-inspection-grid">
                <div><span>Dimensions</span><strong>{netcdfInspection.dimensions.map((item) => `${item.name}=${item.size}`).join(" · ") || "—"}</strong></div>
                <div><span>Coordinates</span><strong>
                  lon={netcdfInspection.coordinates.longitude ?? "—"} · lat={netcdfInspection.coordinates.latitude ?? "—"} · depth={netcdfInspection.coordinates.depth ?? "—"} · time={netcdfInspection.coordinates.time ?? "—"}
                </strong></div>
                <div><span>Profile shape</span><strong>{netcdfInspection.profile_shape?.join(" × ") ?? "not detected"}</strong></div>
                <div><span>Importable variables</span><strong>
                  {netcdfInspection.variables.filter((item) => item.importable_profile_variable).map((item) => item.name).join(", ") || "none"}
                </strong></div>
              </div>
              {netcdfInspection.notes.length > 0 && (
                <ul className="netcdf-inspection-notes">
                  {netcdfInspection.notes.map((note) => <li key={note}>{note}</li>)}
                </ul>
              )}
              <p>
                File bytes stay in this browser. Ocean Canvas does not infer missing coordinates, timestamps,
                units or vertical conventions; files without sufficient CF-style evidence remain inspection-only.
              </p>
            </div>
          )}

        {result ? (
          <>
          <section className="data-lab-analysis-grid">
            <article className="data-lab-result-card">
              <div className="data-lab-card-heading">
                <div>
                  <span>2 · QUALITY</span>
                  <h3>Validation findings</h3>
                </div>
                <strong>{errorIssues.length} errors · {warningIssues.length} warnings</strong>
              </div>
              {result.issues.length === 0 ? (
                <div className="data-lab-pass-message">No schema, range, timestamp, units or provenance issues detected.</div>
              ) : (
                <div className="data-lab-issues">
                  {result.issues.slice(0, 100).map((issue, index) => (
                    <div key={`${issue.severity}-${issue.row ?? "global"}-${index}`} className={issue.severity}>
                      <span>{issue.severity.toUpperCase()}</span>
                      <strong>{issue.row == null ? "Dataset" : `Record ${issue.row}`}</strong>
                      <p>{issue.message}</p>
                    </div>
                  ))}
                  {result.issues.length > 100 && <small>Only the first 100 findings are shown on screen; the report contains all findings.</small>}
                </div>
              )}
            </article>

            <article className="data-lab-result-card">
              <div className="data-lab-card-heading">
                <div>
                  <span>3 · COVERAGE</span>
                  <h3>Scientific coverage</h3>
                </div>
              </div>
              <dl className="data-lab-coverage">
                <div>
                  <dt>Longitude</dt>
                  <dd>{result.spatial.longitudeMin == null ? "—" : `${result.spatial.longitudeMin.toFixed(3)}…${result.spatial.longitudeMax?.toFixed(3)}°`}</dd>
                </div>
                <div>
                  <dt>Latitude</dt>
                  <dd>{result.spatial.latitudeMin == null ? "—" : `${result.spatial.latitudeMin.toFixed(3)}…${result.spatial.latitudeMax?.toFixed(3)}°`}</dd>
                </div>
                <div>
                  <dt>Depth</dt>
                  <dd>{result.spatial.depthMin == null ? "—" : `${result.spatial.depthMin.toFixed(2)}…${result.spatial.depthMax?.toFixed(2)} m`}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{result.timestamps.length ? `${result.timestamps[0]} ${result.timestamps.length > 1 ? `→ ${result.timestamps.at(-1)}` : ""}` : "—"}</dd>
                </div>
              </dl>
              <div className="data-lab-missingness">
                <span>Required-field missingness</span>
                {missingFields.length === 0 ? (
                  <strong>No required-field missingness detected</strong>
                ) : (
                  missingFields.map(([field, count]) => <strong key={field}>{field}: {count}</strong>)
                )}
              </div>
            </article>
          </section>

          <section className="data-lab-result-card data-lab-preview-card">
            <div className="data-lab-card-heading">
              <div>
                <span>5 · PREVIEW</span>
                <h3>Validated-row preview</h3>
              </div>
              <small>First {Math.min(8, filteredRecords.length)} valid rows</small>
            </div>
            {filteredRecords.length === 0 ? (
              <div className="data-lab-inline-empty">No rows passed validation.</div>
            ) : (
              <div className="data-lab-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Record</th><th>Lon</th><th>Lat</th><th>Depth m</th><th>Timestamp</th>
                      <th>Variable</th><th>Value</th><th>Units</th><th>Sensor</th><th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.slice(0, 8).map((record) => (
                      <tr key={`${record.row}-${record.variable}-${record.timestamp}`}>
                        <td>{record.row}</td>
                        <td>{record.longitude.toFixed(4)}</td>
                        <td>{record.latitude.toFixed(4)}</td>
                        <td>{record.depth_m.toFixed(2)}</td>
                        <td>{record.timestamp}</td>
                        <td>{record.variable}</td>
                        <td>{record.value}</td>
                        <td>{record.units}</td>
                        <td>{record.sensor_type}</td>
                        <td>{record.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          </>
        ) : <p className="data-lab-nav-empty">Select a local dataset to inspect validation findings and measured coverage.</p>}
      </section>

      <section id="data-lab-downloads" data-data-lab-home="downloads" className="data-lab-nav-section">
        <div className="data-lab-nav-heading">
          <div><span>DOWNLOADS</span><h3>Schemas and local scientific evidence</h3></div>
          <p>Export only the source-provided measurements that passed validation. A complete validation report remains available for rejected files.</p>
        </div>
        <div className="data-lab-download-actions">
          <button type="button" onClick={downloadSchema}>Download import schema</button>
          <button type="button" disabled={!result} onClick={() => result && downloadReport(result)}>Download validation report</button>
          <button type="button" disabled={!result || result.status !== "validated" || filteredRecords.length === 0} onClick={() => result && downloadFilteredRecords(filteredRecords, "csv", result.filename)}>Export filtered CSV</button>
          <button type="button" disabled={!result || result.status !== "validated" || filteredRecords.length === 0} onClick={() => result && downloadFilteredRecords(filteredRecords, "json", result.filename)}>Export filtered JSON</button>
        </div>
        <small>Local-only files · filtered exports include exact validated measurements, units, coordinates, depth and timestamp · no remote download claim</small>
      </section>

      <section id="data-lab-provenance" data-data-lab-home="provenance" className="data-lab-nav-section">
        <div className="data-lab-nav-heading">
          <div><span>PROVENANCE</span><h3>Where these data came from</h3></div>
          <p>Registered providers describe discoverable sources; local-file metadata below describes only the currently inspected file.</p>
        </div>
        <dl className="data-lab-provenance-grid">
          <div><dt>Local file</dt><dd>{result?.filename ?? "No user dataset loaded"}</dd></div>
          <div><dt>Format</dt><dd>{result?.format.toUpperCase() ?? "Not inspected"}</dd></div>
          <div><dt>Validation outcome</dt><dd>{result?.status ?? "Not validated"}</dd></div>
          <div><dt>Source field values (accepted rows)</dt><dd>{sourceNames.length ? sourceNames.join(" · ") : "No source metadata yet"}</dd></div>
          <div><dt>Dataset IDs (accepted rows)</dt><dd>{datasetIds.length ? datasetIds.join(" · ") : "Not supplied"}</dd></div>
          <div><dt>QC flags (accepted rows)</dt><dd>{qcFlags.length ? qcFlags.join(" · ") : "Not supplied"}</dd></div>
        </dl>
        <p className="data-lab-provenance-note">
          File bytes are parsed locally, never uploaded to the Ocean Canvas server. Imported source labels are user-supplied metadata, not independently authenticated provider evidence. Rejected files cannot be exported as validated rows. The immutable bundled GLORYS/Argo evidence is not overwritten.
        </p>
      </section>
    </main>
  );
}
