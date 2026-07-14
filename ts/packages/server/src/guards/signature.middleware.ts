import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";

/**
 * Extend Express Request to include rawBody
 */
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

/**
 * Middleware to capture raw request body for signature verification
 *
 * This middleware uses express.json()'s `verify` callback to capture the raw body
 * buffer before JSON parsing, ensuring the exact bytes sent by Channel App platform are
 * preserved for HMAC signature verification.
 *
 * **Recommended approach** (NestJS v10+): Use the built-in `rawBody` option instead.
 * ```typescript
 * const app = await NestFactory.create(AppModule, { rawBody: true });
 * ```
 * Then access `request.rawBody` directly in the guard.
 *
 * If you cannot use NestJS built-in rawBody, use this middleware:
 * @example
 * ```typescript
 * // main.ts - disable default body parser and use this middleware
 * const app = await NestFactory.create(AppModule, {
 *   bodyParser: false,
 * });
 *
 * app.use(express.json(jsonWithRawBody()));
 * ```
 *
 * Or apply as NestJS middleware:
 * @example
 * ```typescript
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(SignatureMiddleware)
 *       .forRoutes('functions');
 *   }
 * }
 * ```
 */
@Injectable()
export class SignatureMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    // If rawBody already exists (set by NestJS rawBody option or another middleware), skip
    if (req.rawBody) {
      next();
      return;
    }

    // Collect raw body chunks and wait for the full body before calling next()
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (chunks.length > 0) {
        req.rawBody = Buffer.concat(chunks);
      }
      next();
    });

    req.on("error", (err) => {
      next(err);
    });
  }
}

/**
 * Express middleware function for raw body capture
 * Use this if you prefer a function-based middleware
 *
 * @example
 * ```typescript
 * // main.ts
 * app.use('/functions', rawBodyMiddleware);
 * ```
 */
export function rawBodyMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.rawBody) {
    next();
    return;
  }

  const chunks: Buffer[] = [];

  req.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });

  req.on("end", () => {
    if (chunks.length > 0) {
      req.rawBody = Buffer.concat(chunks);
    }
    next();
  });

  req.on("error", (err) => {
    next(err);
  });
}

/**
 * Create express.json() options with raw body capture
 *
 * This is the recommended middleware approach for signature verification when
 * NestJS built-in rawBody option is not available. It uses express.json()'s
 * `verify` callback to capture the raw buffer synchronously during parsing.
 *
 * @example
 * ```typescript
 * // main.ts
 * import express from 'express';
 *
 * const app = await NestFactory.create(AppModule, {
 *   bodyParser: false, // Disable default body parser
 * });
 *
 * app.use(express.json(jsonWithRawBody()));
 * ```
 */
export function jsonWithRawBody(): {
  verify: (req: Request, res: Response, buf: Buffer) => void;
} {
  return {
    verify: (req: Request, _res: Response, buf: Buffer) => {
      req.rawBody = buf;
    },
  };
}
