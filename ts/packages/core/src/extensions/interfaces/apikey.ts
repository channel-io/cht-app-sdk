/* eslint-disable @typescript-eslint/no-deprecated -- This file defines the deprecated API key compatibility surface. */
import type { GetAuthConfigOutput, ValidateCredentialsOutput } from "../apikey.js";
import type { Context } from "../../types/context.js";

/**
 * API Key Extension Interface
 *
 * Implement this interface to create an API key-based authentication extension.
 *
 * @deprecated Prefer the config extension for new setup surfaces. AppStore
 * keeps API key registration for backward compatibility and may normalize it
 * into config-backed storage.
 *
 * @example
 * ```typescript
 * @Extension({ name: "apikey" })
 * export class MyApiKeyExtension implements ApiKeyExtensionInterface {
 *   @Func("metadata.getAuthConfig")
 *   @OutputSchema(GetAuthConfigOutputSchema)
 *   async getAuthConfig(ctx: Context): Promise<GetAuthConfigOutput> {
 *     return {
 *       authType: "apiKey",
 *       authScope: "channel",
 *       providerName: "My Provider",
 *       fields: [
 *         { name: "apiKey", displayName: "API Key", required: true, sensitive: true },
 *       ],
 *     };
 *   }
 *
 *   @Func("validation.validateCredentials")
 *   @OutputSchema(ValidateCredentialsOutputSchema)
 *   async validateCredentials(
 *     ctx: Context,
 *   ): Promise<ValidateCredentialsOutput> {
 *     return { valid: true };
 *   }
 * }
 * ```
 */
export interface ApiKeyExtensionInterface {
  /**
   * Return API key field configuration for the provider.
   *
   * Function name: "metadata.getAuthConfig"
   *
   * @deprecated Prefer `extension.config.metadata.getConfigSchema`.
   */
  getAuthConfig(ctx: Context): Promise<GetAuthConfigOutput>;

  /**
   * Validate submitted credentials (optional but recommended).
   *
   * Function name: "validation.validateCredentials"
   *
   * @deprecated Prefer config validation hooks or
   * `extension.config.validation.validateStoredConfig`.
   */
  validateCredentials?(ctx: Context): Promise<ValidateCredentialsOutput>;
}

/**
 * API Key Extension Function Names
 *
 * @deprecated Prefer config extension function names for new apps.
 */
export const ApiKeyFunctionNames = {
  getAuthConfig: "metadata.getAuthConfig",
  validateCredentials: "validation.validateCredentials",
} as const;
