/* eslint-disable @typescript-eslint/no-deprecated -- This file defines the deprecated API key compatibility surface. */
import { z } from "zod";
import type {
  ApiKeyField as ProtoApiKeyField,
  ApiKeyGetAuthConfigOutput as ProtoGetAuthConfigOutput,
  ApiKeyValidateCredentialsOutput as ProtoValidateCredentialsOutput,
} from "../gen/channel/app/sdk/v1/extension.js";

type ProtoBacked<T, Proto> = T & Proto;

/**
 * API Key field schema
 *
 * @deprecated Prefer the config extension for new setup surfaces. AppStore
 * keeps API key registration for backward compatibility and may normalize it
 * into config-backed storage.
 */
export const ApiKeyFieldSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  required: z.boolean(),
  sensitive: z.boolean(),
  maskType: z.string().optional(),
  placeholder: z.string().optional(),
  validationRegex: z.string().optional(),
});

/**
 * @deprecated Prefer config extension fields for new setup surfaces.
 */
export type ApiKeyField = ProtoBacked<z.infer<typeof ApiKeyFieldSchema>, ProtoApiKeyField>;

/**
 * Auth scope for API Key extension
 *
 * @deprecated Prefer `ConfigScope` from the config extension.
 */
export const ApiKeyAuthScope = z.enum(["channel", "manager"]);
/**
 * @deprecated Prefer `ConfigScope` from the config extension.
 */
export type ApiKeyAuthScope = z.infer<typeof ApiKeyAuthScope>;

/**
 * Output schema for extension.apikey.metadata.getAuthConfig
 *
 * @deprecated Prefer `extension.config.metadata.getConfigSchema` for new apps.
 */
export const GetAuthConfigOutputSchema = z.object({
  authType: z.literal("apiKey"),
  authScope: ApiKeyAuthScope,
  fields: z.array(ApiKeyFieldSchema).min(1),
  providerName: z.string(),
});

/**
 * @deprecated Prefer `GetConfigSchemaOutput` from the config extension.
 */
export type GetAuthConfigOutput = ProtoBacked<
  z.infer<typeof GetAuthConfigOutputSchema>,
  ProtoGetAuthConfigOutput
>;

/**
 * Output schema for extension.apikey.validation.validateCredentials
 *
 * @deprecated Prefer config validation hooks or
 * `extension.config.validation.validateStoredConfig`.
 */
export const ValidateCredentialsOutputSchema = z.object({
  valid: z.boolean(),
  error_message: z.string().optional(),
  user_info: z
    .object({
      email: z.string().optional(),
      name: z.string().optional(),
      user_id: z.string().optional(),
    })
    .optional(),
});

/**
 * @deprecated Prefer `ValidateStoredConfigOutput` from the config extension.
 */
export type ValidateCredentialsOutput = ProtoBacked<
  z.infer<typeof ValidateCredentialsOutputSchema>,
  ProtoValidateCredentialsOutput
>;
