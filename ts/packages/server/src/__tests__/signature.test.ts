import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { verifySignature, SignatureGuard, SIGNATURE_HEADER } from "../guards/signature.guard.js";
import type { ChannelAppModuleOptions } from "../nestjs/types.js";

/**
 * Helper: compute HMAC-SHA256 signature the same way Channel App platform does.
 * signingKey is hex-encoded, body is raw bytes, result is base64.
 */
function computeSignature(signingKey: string, body: Buffer): string {
  const keyBuffer = Buffer.from(signingKey, "hex");
  return createHmac("sha256", keyBuffer).update(body).digest("base64");
}

/** 64-char hex signing key for tests */
const VALID_HEX_KEY = "ab".repeat(32);

describe("verifySignature", () => {
  it("should return true for a valid signature over raw body", () => {
    const body = Buffer.from('{"method":"hello","params":{"name":"world"}}');
    const sig = computeSignature(VALID_HEX_KEY, body);

    expect(verifySignature(sig, VALID_HEX_KEY, body)).toBe(true);
  });

  it("should return false when body bytes differ (re-serialized JSON)", () => {
    // Channel App platform signs the raw bytes with specific whitespace
    const rawWithSpaces = Buffer.from('{ "method" : "hello" , "params" : { "name" : "world" } }');
    const sig = computeSignature(VALID_HEX_KEY, rawWithSpaces);
    const parsed = JSON.parse(rawWithSpaces.toString());
    const reserialized = Buffer.from(JSON.stringify(parsed));

    // The re-serialized body loses whitespace → signature mismatch
    expect(verifySignature(sig, VALID_HEX_KEY, reserialized)).toBe(false);
    // But raw body works
    expect(verifySignature(sig, VALID_HEX_KEY, rawWithSpaces)).toBe(true);
  });

  it("should return false for an invalid signature", () => {
    const body = Buffer.from('{"key":"value"}');
    expect(verifySignature("invalid-signature", VALID_HEX_KEY, body)).toBe(false);
  });

  it("should return false for wrong signing key", () => {
    const body = Buffer.from('{"key":"value"}');
    const sig = computeSignature(VALID_HEX_KEY, body);
    const wrongKey = "cd".repeat(32);
    expect(verifySignature(sig, wrongKey, body)).toBe(false);
  });

  it("should return false for empty signature", () => {
    const body = Buffer.from("{}");
    expect(verifySignature("", VALID_HEX_KEY, body)).toBe(false);
  });

  it("should return false for malformed signing key", () => {
    const body = Buffer.from("{}");
    // "zz" is not valid hex, Buffer.from will produce empty/garbage
    expect(verifySignature("anysig", "not-hex!", body)).toBe(false);
  });
});

describe("SignatureGuard", () => {
  let guard: SignatureGuard;
  let options: ChannelAppModuleOptions;

  function createMockExecutionContext(overrides: {
    headers?: Record<string, string>;
    rawBody?: Buffer | undefined;
  }): ExecutionContext {
    const request = {
      headers: overrides.headers ?? {},
      rawBody: overrides.rawBody,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
        getNext: () => vi.fn(),
      }),
      getClass: vi.fn(),
      getHandler: vi.fn(),
      getArgs: vi.fn(),
      getArgByIndex: vi.fn(),
      switchToRpc: vi.fn(),
      switchToWs: vi.fn(),
      getType: vi.fn(),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    options = {
      appId: "test-app",
      appSecret: VALID_HEX_KEY,
    };
    // Construct guard with injected options
    guard = new SignatureGuard(options);
  });

  it("should pass when signature is valid", () => {
    const body = Buffer.from('{"method":"test","params":{}}');
    const sig = computeSignature(VALID_HEX_KEY, body);

    const ctx = createMockExecutionContext({
      headers: { [SIGNATURE_HEADER]: sig },
      rawBody: body,
    });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("should throw when X-Signature header is missing", () => {
    const ctx = createMockExecutionContext({
      headers: {},
      rawBody: Buffer.from("{}"),
    });

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it("should throw when rawBody is not available", () => {
    const ctx = createMockExecutionContext({
      headers: { [SIGNATURE_HEADER]: "some-sig" },
      rawBody: undefined,
    });

    expect(() => guard.canActivate(ctx)).toThrow("raw body not available");
  });

  it("should throw when signature is invalid", () => {
    const body = Buffer.from('{"method":"test"}');
    const ctx = createMockExecutionContext({
      headers: { [SIGNATURE_HEADER]: "wrong-signature" },
      rawBody: body,
    });

    expect(() => guard.canActivate(ctx)).toThrow("Invalid signature");
  });

  it("should skip verification when skipSignatureVerification is true", () => {
    options.skipSignatureVerification = true;
    guard = new SignatureGuard(options);

    const ctx = createMockExecutionContext({
      headers: {}, // no signature header
      rawBody: undefined,
    });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("should use signingKey over appSecret when both are provided", () => {
    const dedicatedKey = "cd".repeat(32);
    options.signingKey = dedicatedKey;
    guard = new SignatureGuard(options);

    const body = Buffer.from('{"data":"test"}');
    const sig = computeSignature(dedicatedKey, body);

    const ctx = createMockExecutionContext({
      headers: { [SIGNATURE_HEADER]: sig },
      rawBody: body,
    });

    expect(guard.canActivate(ctx)).toBe(true);

    // Signature computed with appSecret should NOT pass
    const wrongSig = computeSignature(VALID_HEX_KEY, body);
    const ctx2 = createMockExecutionContext({
      headers: { [SIGNATURE_HEADER]: wrongSig },
      rawBody: body,
    });

    expect(() => guard.canActivate(ctx2)).toThrow("Invalid signature");
  });

  it("should throw when no signing key is configured", () => {
    const noKeyOptions: ChannelAppModuleOptions = {
      appId: "test-app",
      appSecret: undefined as unknown as string,
    };
    guard = new SignatureGuard(noKeyOptions);

    const ctx = createMockExecutionContext({
      headers: { [SIGNATURE_HEADER]: "some-sig" },
      rawBody: Buffer.from("{}"),
    });

    expect(() => guard.canActivate(ctx)).toThrow("not configured");
  });

  it("should verify using raw body bytes, not re-serialized JSON", () => {
    // This is the core bug scenario: Channel App platform sends JSON with specific formatting
    // If SDK re-serializes with JSON.stringify, the signature won't match
    const rawJson = '{ "method" :  "test" , "params" : {} }';
    const rawBody = Buffer.from(rawJson);
    const sig = computeSignature(VALID_HEX_KEY, rawBody);

    // Guard uses rawBody directly → should pass
    const ctx = createMockExecutionContext({
      headers: { [SIGNATURE_HEADER]: sig },
      rawBody: rawBody,
    });
    expect(guard.canActivate(ctx)).toBe(true);

    // If we were to use JSON.stringify(JSON.parse(rawJson)), it would fail
    const reserialized = Buffer.from(JSON.stringify(JSON.parse(rawJson)));
    expect(reserialized.toString()).not.toBe(rawJson); // confirm they differ
    expect(verifySignature(sig, VALID_HEX_KEY, reserialized)).toBe(false);
  });
});
