import type { z } from "zod";
import { zodToJsonSchema as zodToJsonSchemaLib } from "zod-to-json-schema";

/**
 * Convert Zod schema to JSON Schema
 */
export function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return zodToJsonSchemaLib(schema, {
    $refStrategy: "none",
  });
}
