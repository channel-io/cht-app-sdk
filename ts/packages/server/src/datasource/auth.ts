import { createHmac, timingSafeEqual } from "node:crypto";
import type { DataSourceAccessTokenIdentity } from "./types.js";

interface JWTHeader {
  alg?: string;
}

interface JWTClaims {
  identity?: string;
  scope?: string[] | string;
}

export function parseJWTAccessToken(
  accessToken: string,
  jwtServiceKey: string
): DataSourceAccessTokenIdentity {
  const token = accessToken.trim();
  if (!token) {
    throw new Error("access token is required");
  }
  if (!jwtServiceKey.trim()) {
    throw new Error("jwt service key is required");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("invalid jwt access token");
  }
  const [encodedHeader, encodedPayload, encodedSignature] = parts as [string, string, string];
  const header = JSON.parse(base64URLDecode(encodedHeader).toString("utf8")) as JWTHeader;
  if (header.alg !== "HS256") {
    throw new Error(`unsupported jwt algorithm: ${header.alg ?? ""}`);
  }

  const expectedSignature = createHmac("sha256", jwtServiceKey)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const actualSignature = base64URLDecode(encodedSignature);
  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    throw new Error("invalid jwt signature");
  }

  return parseJWTAccessTokenUnverified(token);
}

export function parseJWTAccessTokenUnverified(accessToken: string): DataSourceAccessTokenIdentity {
  const token = accessToken.trim();
  if (!token) {
    throw new Error("access token is required");
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("invalid jwt access token");
  }
  const [, encodedPayload] = parts as [string, string, string];
  const claims = JSON.parse(base64URLDecode(encodedPayload).toString("utf8")) as JWTClaims;
  const scopes = scopeMap(claims.scope);
  const [callerType, callerID] = splitScopeEntry(claims.identity ?? "");
  const identity: DataSourceAccessTokenIdentity = {
    accessToken: token,
    scopes,
  };
  const appId = firstScope(scopes, "app");
  const channelId = firstScope(scopes, "channel");
  const managerId = firstScope(scopes, "manager");
  if (appId) {
    identity.appId = appId;
  }
  if (channelId) {
    identity.channelId = channelId;
  }
  if (managerId) {
    identity.managerId = managerId;
  }
  if (callerType) {
    identity.callerType = callerType;
  }
  if (callerID) {
    identity.callerID = callerID;
  }
  return identity;
}

export function dataSourceSignaturePayload(
  serializedRequest: Uint8Array,
  accessToken: string
): Buffer {
  return Buffer.concat([
    Buffer.from(serializedRequest),
    Buffer.from("\n", "utf8"),
    Buffer.from(accessToken, "utf8"),
  ]);
}

export function verifyDataSourceSignature(
  signature: string,
  signingKey: string,
  serializedRequest: Uint8Array,
  accessToken: string
): boolean {
  try {
    const key = Buffer.from(signingKey.trim(), "hex");
    const payload = dataSourceSignaturePayload(serializedRequest, accessToken);
    const expected = createHmac("sha256", key).update(payload).digest();
    const actual = Buffer.from(signature.trim(), "base64");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function createJWTAccessTokenValidator(jwtServiceKey: string) {
  return (accessToken: string): DataSourceAccessTokenIdentity =>
    parseJWTAccessToken(accessToken, jwtServiceKey);
}

function base64URLDecode(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function scopeMap(scope: string[] | string | undefined): Record<string, string[]> {
  const scopes = Array.isArray(scope) ? scope : typeof scope === "string" ? scope.split(/\s+/) : [];
  const result: Record<string, string[]> = {};
  for (const entry of scopes) {
    const [key, value] = splitScopeEntry(entry);
    if (!key || !value) {
      continue;
    }
    result[key] = [...(result[key] ?? []), value];
  }
  return result;
}

function firstScope(scopes: Record<string, string[]>, key: string): string | undefined {
  return scopes[key]?.[0];
}

function splitScopeEntry(value: string): [string, string] {
  const index = value.indexOf("-");
  if (index < 0) {
    return [value, ""];
  }
  return [value.slice(0, index), value.slice(index + 1)];
}
