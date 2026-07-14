import { zodToJsonSchema } from "../utils/zod-to-json-schema.js";
import type { FunctionDefinition, FunctionHandler, RegisteredFunction } from "../types/function.js";
import type { Context } from "../types/context.js";

/**
 * Create a registered function from a definition
 * @internal
 */
export function createRegisteredFunction(
  name: string,
  definition: FunctionDefinition
): RegisteredFunction {
  const inputSchema = zodToJsonSchema(definition.input);
  const outputSchema = definition.output ? zodToJsonSchema(definition.output) : undefined;

  // Wrap handler to validate input
  const wrappedHandler: FunctionHandler = async (ctx: Context, params: unknown) => {
    const validatedInput = definition.input.parse(params);
    const result = await definition.handler(ctx, validatedInput);

    if (definition.output) {
      return definition.output.parse(result);
    }

    return result;
  };

  const result: RegisteredFunction = {
    name,
    inputSchema,
    handler: wrappedHandler,
  };

  if (definition.description !== undefined) {
    result.description = definition.description;
  }

  if (outputSchema !== undefined) {
    result.outputSchema = outputSchema;
  }

  return result;
}
