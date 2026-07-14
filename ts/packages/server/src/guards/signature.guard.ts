import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
  Inject,
  type Type,
} from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import { CHANNEL_APP_OPTIONS, type ChannelAppModuleOptions } from "../nestjs/types.js";

/**
 * Header name for the signature
 */
export const SIGNATURE_HEADER = "x-signature";

/**
 * Verify HMAC-SHA256 signature from Channel App platform
 *
 * Algorithm:
 * 1. Decode signing key from hex format
 * 2. Create HMAC-SHA256 hash of the raw request body
 * 3. Encode result as Base64
 * 4. Compare with X-Signature header using timing-safe comparison
 *
 * @param signature The X-Signature header value
 * @param signingKey The hex-encoded signing key (from app secret or dedicated signing key)
 * @param body Raw request body bytes
 * @returns true if signature is valid
 */
export function verifySignature(signature: string, signingKey: string, body: Buffer): boolean {
  try {
    // Decode the signing key from hex format
    const keyBuffer = Buffer.from(signingKey, "hex");

    // Create HMAC-SHA256 hash
    const hmac = createHmac("sha256", keyBuffer);
    hmac.update(body);

    // Get Base64 encoded signature
    const computedSignature = hmac.digest("base64");

    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, "utf-8");
    const computedBuffer = Buffer.from(computedSignature, "utf-8");

    // Buffers must be same length for timingSafeEqual
    if (signatureBuffer.length !== computedBuffer.length) {
      return false;
    }

    return timingSafeEqual(signatureBuffer, computedBuffer);
  } catch {
    return false;
  }
}

/**
 * NestJS Guard for verifying X-Signature header from Channel App platform
 *
 * This guard verifies that incoming requests are authentically from Channel App platform
 * by validating the HMAC-SHA256 signature in the X-Signature header.
 *
 * @example
 * ```typescript
 * // Apply to a specific controller
 * @UseGuards(SignatureGuard)
 * @Controller('functions')
 * export class FunctionsController { ... }
 *
 * // Or apply globally in module
 * @Module({
 *   providers: [
 *     { provide: APP_GUARD, useClass: SignatureGuard },
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * IMPORTANT: For this guard to work, you must configure raw body parsing:
 * ```typescript
 * // main.ts
 * app.useBodyParser('raw', { type: 'application/json' });
 * ```
 *
 * Or use the `SignatureMiddleware` which handles body buffering automatically.
 */
@Injectable()
export class SignatureGuard implements CanActivate {
  private readonly logger = new Logger(SignatureGuard.name);

  constructor(
    @Inject(CHANNEL_APP_OPTIONS)
    private readonly options: ChannelAppModuleOptions
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Skip if signature verification is disabled
    if (this.options.skipSignatureVerification) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const signature = request.headers[SIGNATURE_HEADER];

    if (!signature) {
      this.logger.warn("Missing X-Signature header");
      throw new UnauthorizedException("Missing X-Signature header");
    }

    // Get the signing key (use signingKey if provided, otherwise derive from appSecret)
    const signingKey = this.options.signingKey ?? this.options.appSecret;

    if (!signingKey) {
      this.logger.error("No signing key configured");
      throw new UnauthorizedException("Signature verification not configured");
    }

    // Get raw body - requires raw body middleware
    const rawBody = request.rawBody;
    if (!rawBody) {
      this.logger.error("Raw body not available. Ensure raw body middleware is configured.");
      throw new UnauthorizedException("Cannot verify signature - raw body not available");
    }

    const isValid = verifySignature(signature, signingKey, rawBody);

    if (!isValid) {
      this.logger.warn("Invalid signature");
      throw new UnauthorizedException("Invalid signature");
    }

    if (this.options.debug) {
      this.logger.debug("Signature verified successfully");
    }

    return true;
  }
}

/**
 * Factory function to create SignatureGuard with custom options
 * Useful when you need to customize the guard behavior
 */
export function createSignatureGuard(options?: { skipForRoutes?: string[] }): Type<CanActivate> {
  @Injectable()
  class ConfigurableSignatureGuard extends SignatureGuard {
    override canActivate(context: ExecutionContext): boolean {
      // Check if route should be skipped
      if (options?.skipForRoutes) {
        const request = context.switchToHttp().getRequest();
        const path = request.path || request.url;
        if (options.skipForRoutes.some((route) => path.startsWith(route))) {
          return true;
        }
      }
      return super.canActivate(context);
    }
  }

  return ConfigurableSignatureGuard;
}
