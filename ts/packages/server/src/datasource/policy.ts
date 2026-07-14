import { DataSourceErrorCode, DataSourceExecutionError } from "./types.js";

export interface DataSourceTableConfig {
  name: string;
  tenantColumn?: string;
}

const blockedSqlKeywords = [
  "alter",
  "analyze",
  "begin",
  "call",
  "commit",
  "copy",
  "create",
  "delete",
  "drop",
  "export",
  "grant",
  "import",
  "insert",
  "load",
  "merge",
  "revoke",
  "rollback",
  "set",
  "truncate",
  "update",
  "vacuum",
];

export function isSingleReadOnlyStatement(query: string): boolean {
  const normalized = trimSql(query);
  if (!normalized || normalized.includes(";")) {
    return false;
  }
  const lower = normalized.toLowerCase();
  if (!/^(select|with)\s/i.test(normalized)) {
    return false;
  }
  return !blockedSqlKeywords.some((keyword) => containsIdentifier(lower, keyword));
}

export function containsIdentifier(query: string, identifier: string): boolean {
  const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Za-z0-9_])${escaped}([^A-Za-z0-9_]|$)`, "i").test(query);
}

export function referencedTables(
  query: string,
  explicitTableNames: readonly string[] = [],
  tables: readonly DataSourceTableConfig[] = []
): string[] {
  if (explicitTableNames.length > 0) {
    return [...explicitTableNames];
  }
  return tables
    .filter((table) => table.name && containsIdentifier(query, table.name))
    .map((table) => table.name);
}

export function validateReadOnlyQuery(
  query: string,
  explicitTableNames: readonly string[] = [],
  tables: readonly DataSourceTableConfig[] = []
): void {
  if (!query.trim()) {
    throw new DataSourceExecutionError({
      code: DataSourceErrorCode.InvalidArgument,
      message: "query is required",
    });
  }
  if (!isSingleReadOnlyStatement(query)) {
    throw new DataSourceExecutionError({
      code: DataSourceErrorCode.QueryInvalid,
      message: "query must be a single read-only SELECT statement",
    });
  }
  if (tables.length === 0) {
    return;
  }

  const allowedTables = new Set(tables.map((table) => table.name.toLowerCase()));
  const tableNames = referencedTables(query, explicitTableNames, tables);
  if (tableNames.length === 0) {
    throw new DataSourceExecutionError({
      code: DataSourceErrorCode.QueryInvalid,
      message: "query must reference a supported datasource table",
    });
  }
  for (const tableName of tableNames) {
    if (!allowedTables.has(tableName.toLowerCase())) {
      throw new DataSourceExecutionError({
        code: DataSourceErrorCode.TableNotFound,
        message: `unsupported datasource table: ${tableName}`,
      });
    }
  }
}

export function queryWithRowLimit(query: string, rowLimit: number | undefined): string {
  const normalized = trimSql(query);
  const limit = Math.trunc(rowLimit ?? 0);
  if (limit <= 0) {
    return normalized;
  }
  return `SELECT * FROM (${normalized}) AS datasource_query LIMIT ${limit}`;
}

export class DataSourceByteLimitTracker {
  private sentBytes = 0;

  constructor(private readonly byteLimit: number | undefined) {}

  reserve(size: number): void {
    const limit = Math.trunc(this.byteLimit ?? 0);
    if (limit <= 0) {
      return;
    }
    this.sentBytes += size;
    if (this.sentBytes > limit) {
      throw new DataSourceExecutionError({
        code: DataSourceErrorCode.LimitExceeded,
        message: "datasource query byte limit exceeded",
      });
    }
  }
}

function trimSql(query: string): string {
  return query.trim().replace(/;+$/, "").trim();
}
