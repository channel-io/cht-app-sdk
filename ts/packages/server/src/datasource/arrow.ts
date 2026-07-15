import { createRequire } from "node:module";
import type { QueryChunk, QueryChunkSink } from "./types.js";
import { DataSourceErrorCode, DataSourceExecutionError } from "./types.js";

export interface ArrowColumn {
  name: string;
  type?: string;
  databaseType?: string;
  precision?: number;
  scale?: number;
}

export interface ArrowField extends ArrowColumn {
  dataTypeID?: number;
  nullable?: boolean;
}

export type ArrowRow = Record<string, unknown>;

export interface ArrowBatchWriteOptions {
  sendSchema?: boolean;
  byteLimit?: ByteLimitTrackerLike;
}

export interface ArrowBatchWriteResult {
  schemaSent: boolean;
  frameCount: number;
}

export interface ByteLimitTrackerLike {
  reserve(size: number): void;
}

interface ApacheArrowModule {
  Binary: new () => unknown;
  Bool: new () => unknown;
  DateDay: new () => unknown;
  Decimal: new (scale: number, precision: number, bitWidth?: number) => unknown;
  Float64: new () => unknown;
  Int16: new () => unknown;
  Int32: new () => unknown;
  Int64: new () => unknown;
  Message: {
    decode(bytes: Uint8Array): { bodyLength?: number | bigint; headerType: number };
  };
  MessageHeader: {
    DictionaryBatch: number;
    RecordBatch: number;
    Schema: number;
  };
  Table: new (columns: Record<string, unknown>) => unknown;
  TimestampMillisecond: new (timezone?: string) => unknown;
  Utf8: new () => unknown;
  tableFromArrays(arrays: Record<string, unknown[]>): unknown;
  tableToIPC(table: unknown, type: "stream"): Uint8Array;
  vectorFromArray?(values: readonly unknown[], type: unknown): unknown;
}

let cachedArrow: ApacheArrowModule | undefined;

interface DecimalTypeSpec {
  precision: number;
  scale: number;
  bitWidth: 128 | 256;
}

const defaultDecimalPrecision = 38;
const defaultDecimalScale = 0;
const hugeIntPrecision = 39;
const int256Precision = 76;
const maxDecimalPrecision = 76;

export function encodeRowsToArrowIPC(columns: ArrowColumn[], rows: ArrowRow[]): Uint8Array {
  if (columns.length === 0) {
    throw new Error("columns are required");
  }
  return rowsToArrowIPC(
    columns,
    rows.map((row) => columns.map((column) => row[column.name]))
  );
}

export function arrowRowsChunk(columns: ArrowColumn[], rows: ArrowRow[]): QueryChunk {
  return {
    arrow: {
      dataBody: encodeRowsToArrowIPC(columns, rows),
    },
  };
}

export function resultChunk(rowCount: number, limitExceeded = false, executionMs = 0): QueryChunk {
  return {
    result: {
      rowCount,
      limitExceeded,
      executionMs,
    },
  };
}

export function writeRowsAsArrowIpcBatch(
  sink: QueryChunkSink,
  fields: readonly ArrowField[],
  rows: readonly (readonly unknown[])[],
  options: ArrowBatchWriteOptions = {}
): ArrowBatchWriteResult {
  return writeArrowIpcStream(sink, rowsToArrowIPC(fields, rows), options);
}

export function writeObjectRowsAsArrowIpcBatch(
  sink: QueryChunkSink,
  columns: readonly ArrowColumn[],
  rows: readonly ArrowRow[],
  options: ArrowBatchWriteOptions = {}
): ArrowBatchWriteResult {
  return writeRowsAsArrowIpcBatch(
    sink,
    columns,
    rows.map((row) => columns.map((column) => row[column.name])),
    options
  );
}

export function writeArrowIpcStream(
  sink: QueryChunkSink,
  bytes: Uint8Array,
  options: ArrowBatchWriteOptions = {}
): ArrowBatchWriteResult {
  let schemaSent = false;
  let frameCount = 0;

  for (const frame of splitArrowIpcStream(bytes)) {
    if (frame.kind === "schema") {
      if (options.sendSchema !== false) {
        sendArrowFrame(sink, frame, options.byteLimit);
        schemaSent = true;
        frameCount++;
      }
      continue;
    }
    sendArrowFrame(sink, frame, options.byteLimit);
    frameCount++;
  }

  return { schemaSent, frameCount };
}

function sendArrowFrame(
  sink: QueryChunkSink,
  frame: ArrowIpcFrame,
  byteLimit?: ByteLimitTrackerLike
): void {
  byteLimit?.reserve(frame.dataHeader.byteLength + frame.dataBody.byteLength);
  sink.send({
    arrow: {
      dataHeader: frame.dataHeader,
      ...(frame.dataBody.byteLength > 0 ? { dataBody: frame.dataBody } : {}),
    },
  });
}

function rowsToArrowIPC(
  fields: readonly ArrowField[],
  rows: readonly (readonly unknown[])[]
): Uint8Array {
  if (fields.length === 0) {
    throw new Error("columns are required");
  }
  const arrow = loadApacheArrow();
  const usedNames = new Map<string, number>();
  const arrays: Record<string, unknown> = {};

  fields.forEach((field, index) => {
    const name = uniqueColumnName(field.name || `column_${index + 1}`, usedNames);
    const values = rows.map((row) => normalizeArrowValue(row[index], field));
    const type = arrowTypeFromField(arrow, field);
    arrays[name] = arrow.vectorFromArray ? arrow.vectorFromArray(values, type) : values;
  });

  const table = arrow.vectorFromArray
    ? new arrow.Table(arrays)
    : arrow.tableFromArrays(arrays as Record<string, unknown[]>);
  return arrow.tableToIPC(table, "stream");
}

type ArrowFrameKind = "schema" | "body";

interface ArrowIpcFrame {
  kind: ArrowFrameKind;
  dataHeader: Uint8Array;
  dataBody: Uint8Array;
}

function splitArrowIpcStream(bytes: Uint8Array): ArrowIpcFrame[] {
  const arrow = loadApacheArrow();
  const frames: ArrowIpcFrame[] = [];
  let offset = 0;

  while (offset < bytes.byteLength) {
    const frameStart = offset;
    let metadataLength = readInt32LE(bytes, offset);
    offset += 4;
    if (metadataLength === 0) {
      break;
    }
    if (metadataLength === -1) {
      metadataLength = readInt32LE(bytes, offset);
      offset += 4;
      if (metadataLength === 0) {
        break;
      }
    }

    const headerStart = frameStart;
    const metadataStart = offset;
    const metadataEnd = metadataStart + metadataLength;
    if (metadataEnd > bytes.byteLength) {
      throw new Error("invalid Arrow IPC metadata length");
    }
    const message = arrow.Message.decode(bytes.slice(metadataStart, metadataEnd));
    const bodyLength = Number(message.bodyLength ?? 0);
    const frameEnd = metadataEnd + bodyLength;
    if (frameEnd > bytes.byteLength) {
      throw new Error("invalid Arrow IPC body length");
    }
    const dataHeader = bytes.slice(headerStart, metadataEnd);
    const dataBody = bytes.slice(metadataEnd, frameEnd);

    if (message.headerType === arrow.MessageHeader.Schema) {
      frames.push({ kind: "schema", dataHeader, dataBody });
    } else if (
      message.headerType === arrow.MessageHeader.RecordBatch ||
      message.headerType === arrow.MessageHeader.DictionaryBatch
    ) {
      frames.push({ kind: "body", dataHeader, dataBody });
    }
    offset = frameEnd;
  }
  return frames;
}

function arrowTypeFromField(arrow: ApacheArrowModule, field: ArrowField): unknown {
  const decimalSpec = decimalTypeSpecFromField(field);
  if (decimalSpec) {
    return arrowDecimalType(arrow, decimalSpec);
  }

  switch (field.dataTypeID) {
    case 16:
      return new arrow.Bool();
    case 21:
      return new arrow.Int16();
    case 23:
      return new arrow.Int32();
    case 20:
      return new arrow.Int64();
    case 700:
    case 701:
      return new arrow.Float64();
    case 17:
      return new arrow.Binary();
    case 1082:
      return new arrow.DateDay();
    case 1114:
    case 1184:
      return new arrow.TimestampMillisecond("UTC");
    default:
      return arrowTypeFromDatabaseTypeName(arrow, field.databaseType ?? field.type);
  }
}

function arrowTypeFromDatabaseTypeName(
  arrow: ApacheArrowModule,
  databaseType: string | undefined
): unknown {
  const decimalSpec = decimalTypeSpecFromDatabaseTypeName(databaseType);
  if (decimalSpec) {
    return arrowDecimalType(arrow, decimalSpec);
  }

  switch (baseDatabaseTypeName(databaseType)) {
    case "BOOL":
    case "BOOLEAN":
      return new arrow.Bool();
    case "INT2":
    case "SMALLINT":
      return new arrow.Int16();
    case "INT4":
    case "INTEGER":
    case "SERIAL":
      return new arrow.Int32();
    case "INT8":
    case "BIGINT":
    case "BIGSERIAL":
      return new arrow.Int64();
    case "FLOAT4":
    case "FLOAT8":
    case "REAL":
    case "DOUBLE":
    case "DOUBLE PRECISION":
      return new arrow.Float64();
    case "BYTEA":
    case "BINARY":
    case "VARBINARY":
      return new arrow.Binary();
    case "DATE":
      return new arrow.DateDay();
    case "TIMESTAMP":
    case "TIMESTAMPTZ":
    case "TIMESTAMPZ":
    case "DATETIME":
      return new arrow.TimestampMillisecond("UTC");
    default:
      return new arrow.Utf8();
  }
}

function normalizeArrowValue(value: unknown, field: ArrowField): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  const decimalSpec = decimalTypeSpecFromField(field);
  if (decimalSpec) {
    return decimalWordsFromValue(value, decimalSpec);
  }
  switch (field.dataTypeID) {
    case 20:
      return typeof value === "bigint" ? value : BigInt(stringifyArrowValue(value));
    case 21:
    case 23:
    case 700:
    case 701:
      return Number(value);
    case 17:
      return value instanceof Uint8Array ? value : Buffer.from(stringifyArrowValue(value));
    case 1082:
    case 1114:
    case 1184:
      return value instanceof Date ? value : new Date(stringifyArrowValue(value));
    case 114:
    case 3802:
      return typeof value === "string" ? value : JSON.stringify(value);
    default:
      if (value instanceof Date || value instanceof Uint8Array) {
        return value;
      }
      if (typeof value === "bigint") {
        return value;
      }
      if (typeof value === "object") {
        return JSON.stringify(value);
      }
      return value;
  }
}

function arrowDecimalType(arrow: ApacheArrowModule, spec: DecimalTypeSpec): unknown {
  return new arrow.Decimal(spec.scale, spec.precision, spec.bitWidth);
}

function decimalTypeSpecFromField(field: ArrowField): DecimalTypeSpec | undefined {
  const parsed = decimalTypeSpecFromDatabaseTypeName(field.databaseType ?? field.type);
  const fallback = field.dataTypeID === 1700 ? defaultDecimalTypeSpec() : undefined;
  return applyFieldDecimalMetadata(parsed ?? fallback, field);
}

function applyFieldDecimalMetadata(
  spec: DecimalTypeSpec | undefined,
  field: ArrowField
): DecimalTypeSpec | undefined {
  if (!spec) {
    return undefined;
  }
  return normalizeDecimalTypeSpec({
    precision:
      Number.isFinite(field.precision) && field.precision ? field.precision : spec.precision,
    scale: Number.isFinite(field.scale) ? field.scale : spec.scale,
  });
}

function decimalTypeSpecFromDatabaseTypeName(
  databaseType: string | undefined
): DecimalTypeSpec | undefined {
  const base = baseDatabaseTypeName(databaseType);
  const parsed = parseDecimalPrecisionScale(databaseType);

  switch (base) {
    case "DECIMAL":
    case "DEC":
    case "NUMERIC":
      return normalizeDecimalTypeSpec({
        precision: parsed?.precision ?? defaultDecimalPrecision,
        scale: parsed?.scale ?? defaultDecimalScale,
      });
    case "BIGNUMERIC":
    case "BIGDECIMAL":
      return normalizeDecimalTypeSpec({
        precision: parsed?.precision ?? maxDecimalPrecision,
        scale: parsed?.scale ?? 38,
      });
    case "HUGEINT":
    case "INT128":
    case "UHUGEINT":
    case "UINT128":
      return normalizeDecimalTypeSpec({ precision: hugeIntPrecision, scale: 0 });
    case "INT256":
    case "UINT256":
      return normalizeDecimalTypeSpec({
        precision: parsed?.precision ?? int256Precision,
        scale: parsed?.scale ?? 0,
      });
    default:
      return undefined;
  }
}

function normalizeDecimalTypeSpec(input: {
  precision: number | undefined;
  scale: number | undefined;
}): DecimalTypeSpec | undefined {
  const precision = Math.trunc(input.precision ?? defaultDecimalPrecision);
  const scale = Math.trunc(input.scale ?? defaultDecimalScale);
  if (precision <= 0 || precision > maxDecimalPrecision || scale < 0) {
    return undefined;
  }
  return {
    precision,
    scale,
    bitWidth: precision <= defaultDecimalPrecision ? 128 : 256,
  };
}

function defaultDecimalTypeSpec(): DecimalTypeSpec {
  return {
    precision: defaultDecimalPrecision,
    scale: defaultDecimalScale,
    bitWidth: 128,
  };
}

function baseDatabaseTypeName(databaseType: string | undefined): string | undefined {
  const normalized = databaseType?.trim().toUpperCase();
  if (!normalized) {
    return undefined;
  }
  const parametersStart = normalized.indexOf("(");
  return parametersStart === -1 ? normalized : normalized.slice(0, parametersStart).trimEnd();
}

function parseDecimalPrecisionScale(
  databaseType: string | undefined
): { precision: number; scale: number } | undefined {
  const match = databaseType?.trim().match(/\((\d+)(?:\s*,\s*(\d+))?\)/);
  if (!match) {
    return undefined;
  }
  return {
    precision: Number.parseInt(match[1] ?? "", 10),
    scale: match[2] === undefined ? 0 : Number.parseInt(match[2], 10),
  };
}

function decimalWordsFromValue(value: unknown, spec: DecimalTypeSpec): Uint32Array {
  if (value instanceof Uint32Array && value.length === spec.bitWidth / 32) {
    return value;
  }
  const scaled = decimalScaledIntegerFromValue(value, spec);
  const maxDigits = scaled < 0 ? (-scaled).toString().length : scaled.toString().length;
  if (maxDigits > spec.precision) {
    throw new Error(`decimal value does not fit precision ${spec.precision}`);
  }
  return bigintToTwosComplementWords(scaled, spec.bitWidth);
}

function decimalScaledIntegerFromValue(value: unknown, spec: DecimalTypeSpec): bigint {
  if (typeof value === "bigint") {
    return value * 10n ** BigInt(spec.scale);
  }
  return parseDecimalStringToScaledInteger(stringifyArrowValue(value), spec.scale);
}

function parseDecimalStringToScaledInteger(value: string, scale: number): bigint {
  const expanded = expandExponentialDecimal(value.trim());
  const match = /^([+-])?(\d*)(?:\.(\d*))?$/.exec(expanded);
  if (!match) {
    throw new Error(`invalid decimal value: ${value}`);
  }

  const sign = match[1] === "-" ? -1n : 1n;
  const integerDigits = match[2] ?? "0";
  const fractionDigits = match[3] ?? "";
  const extraFractionDigits = fractionDigits.slice(scale);
  if (/[1-9]/.test(extraFractionDigits)) {
    throw new Error(`decimal value has more than ${scale} fractional digits`);
  }

  const scaledDigits = `${integerDigits}${fractionDigits.slice(0, scale).padEnd(scale, "0")}`;
  const normalizedDigits = scaledDigits.replace(/^0+(?=\d)/, "") || "0";
  return sign * BigInt(normalizedDigits);
}

function expandExponentialDecimal(value: string): string {
  const [coefficient, exponentText] = value.toLowerCase().split("e") as [
    string,
    string | undefined,
  ];
  if (exponentText === undefined) {
    return value;
  }

  const exponent = Number.parseInt(exponentText, 10);
  if (!Number.isFinite(exponent)) {
    return value;
  }
  const sign = coefficient.startsWith("-") || coefficient.startsWith("+") ? coefficient[0] : "";
  const unsignedCoefficient = sign ? coefficient.slice(1) : coefficient;
  const decimalIndex = unsignedCoefficient.indexOf(".");
  const digits = unsignedCoefficient.replace(".", "");
  const integerDigitCount = decimalIndex === -1 ? unsignedCoefficient.length : decimalIndex;
  const newDecimalIndex = integerDigitCount + exponent;

  if (newDecimalIndex <= 0) {
    return `${sign}0.${"0".repeat(-newDecimalIndex)}${digits}`;
  }
  if (newDecimalIndex >= digits.length) {
    return `${sign}${digits}${"0".repeat(newDecimalIndex - digits.length)}`;
  }
  return `${sign}${digits.slice(0, newDecimalIndex)}.${digits.slice(newDecimalIndex)}`;
}

function bigintToTwosComplementWords(value: bigint, bitWidth: 128 | 256): Uint32Array {
  const wordCount = bitWidth / 32;
  const modulus = 1n << BigInt(bitWidth);
  let normalized = value < 0n ? modulus + value : value;
  if (normalized < 0n || normalized >= modulus) {
    throw new Error(`decimal value does not fit ${bitWidth}-bit Arrow decimal`);
  }

  const words = new Uint32Array(wordCount);
  for (let index = 0; index < wordCount; index++) {
    words[index] = Number(normalized & 0xffffffffn);
    normalized >>= 32n;
  }
  return words;
}

function stringifyArrowValue(value: unknown): string {
  switch (typeof value) {
    case "string":
      return value;
    case "number":
    case "boolean":
    case "bigint":
      return value.toString();
    case "symbol":
      return value.description ?? "";
    case "undefined":
      return "";
    case "function":
      return "";
    case "object":
      if (value === null) {
        return "";
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (value instanceof Uint8Array) {
        return Buffer.from(value).toString();
      }
      return JSON.stringify(value);
  }
}

function uniqueColumnName(name: string, usedNames: Map<string, number>): string {
  const previous = usedNames.get(name) ?? 0;
  usedNames.set(name, previous + 1);
  return previous === 0 ? name : `${name}_${previous + 1}`;
}

function readInt32LE(bytes: Uint8Array, offset: number): number {
  if (offset + 4 > bytes.byteLength) {
    throw new Error("invalid Arrow IPC frame");
  }
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getInt32(0, true);
}

function loadApacheArrow(): ApacheArrowModule {
  if (cachedArrow) {
    return cachedArrow;
  }
  try {
    const require = createRequire(import.meta.url);
    cachedArrow = require("apache-arrow") as ApacheArrowModule;
    return cachedArrow;
  } catch (error) {
    throw new DataSourceExecutionError({
      code: DataSourceErrorCode.Unavailable,
      message: `apache-arrow is required for datasource Arrow conversion: ${errorMessage(error)}`,
      retryable: false,
      cause: error,
    });
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
