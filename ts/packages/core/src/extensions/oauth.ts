import { z } from "zod";
import type {
  OAuthConfig as ProtoOAuthConfig,
  OAuthCredentialValidationInput as ProtoCredentialValidationInput,
  OAuthCredentialValidationResult as ProtoCredentialValidationResult,
  OAuthProvider as ProtoOAuthProvider,
} from "../gen/channel/app/sdk/v1/extension.js";

type ProtoBacked<T, Proto> = T & Proto;

/**
 * OAuth standard parameter naming convention.
 *
 * - `"snake"` (default): RFC 6749 standard (`client_id`, `redirect_uri`, `response_type`, `grant_type`, `refresh_token`).
 *   Used by Google, Slack, GitHub, and most OAuth 2.0 providers.
 * - `"camel"`: camelCase (`clientId`, `redirectUri`, `responseType`, `grantType`, `refreshToken`).
 *   Required by some tenant-aware providers such as Imweb. Applies to both authorize URL and token endpoint.
 */
export const ParameterCaseSchema = z.enum(["snake", "camel"]);
export type ParameterCase = z.infer<typeof ParameterCaseSchema>;

export const TokenRequestContentTypeSchema = z.enum(["form", "json"]);
export type TokenRequestContentType = z.infer<typeof TokenRequestContentTypeSchema>;

export const AuthorizationOpenModeSchema = z.enum(["popup", "currentTab"]);
export type AuthorizationOpenMode = z.infer<typeof AuthorizationOpenModeSchema>;

export const OAuthAuthScopeSchema = z.enum(["channel", "manager"]);
export type OAuthAuthScope = z.infer<typeof OAuthAuthScopeSchema>;

/**
 * OAuth 2.0 provider metadata returned from metadata.getAuthConfig.
 *
 * Client credentials are intentionally excluded. AppStore stores and manages
 * provider client ID/secret separately through Desk APIs/UI.
 */
export const OAuthProviderSchema = z.object({
  provider: z.string().min(1),
  authorizationUrl: z.string().url(),
  tokenUrl: z.string().url(),
  refreshTokenUrl: z.string().url().optional(),
  scopes: z.array(z.string()).min(1),
  providerName: z.string().min(1),
  providerDescription: z.string().optional(),
  providerIconUrl: z.string().url().optional(),
  pkceRequired: z.boolean().optional(),
  additionalParams: z.record(z.string()).optional(),
  /**
   * OAuth standard parameter naming convention. Defaults to `"snake"` (RFC 6749).
   * Declare `"camel"` when the provider (e.g. Imweb) requires camelCase keys
   * on the authorize URL and token endpoint.
   */
  parameterCase: ParameterCaseSchema.optional(),
  /**
   * Token endpoint request body format. Defaults to `"form"` for RFC 6749
   * providers, but some providers expect JSON bodies.
   */
  tokenRequestContentType: TokenRequestContentTypeSchema.optional(),
  /**
   * OAuth callback query parameter name that contains the authorization code.
   * Defaults to `"code"`. Some providers, such as Amazon SP-API, use a
   * provider-specific name.
   */
  authorizationCodeParamName: z
    .string()
    .regex(/^[A-Za-z0-9_.-]+$/)
    .optional(),
  /**
   * Browser surface used to open the provider authorization URL. Defaults to
   * `"popup"`. Declare `"currentTab"` when the provider redirects to a full
   * Desk/AppStore URL and cannot complete the popup close contract reliably.
   */
  authorizationOpenMode: AuthorizationOpenModeSchema.optional(),
});
export type OAuthProvider = ProtoBacked<z.infer<typeof OAuthProviderSchema>, ProtoOAuthProvider>;

/**
 * Output schema for extension.oauth.metadata.getAuthConfig.
 */
export const OAuthConfigSchema = z.object({
  authType: z.literal("oauth"),
  authScope: OAuthAuthScopeSchema,
  oauthProvider: OAuthProviderSchema,
});

export type OAuthConfig = ProtoBacked<z.infer<typeof OAuthConfigSchema>, ProtoOAuthConfig>;

/**
 * Input schema for extension.oauth.validation.validateCredentials.
 *
 * AppStore calls this with an empty params object after token exchange and
 * injects the decrypted access token into context.authToken. accessToken is
 * kept optional for local test harnesses and older examples.
 */
export const CredentialValidationInputSchema = z
  .object({
    accessToken: z.string().optional(),
  })
  .passthrough();

export type CredentialValidationInput = ProtoBacked<
  z.infer<typeof CredentialValidationInputSchema>,
  ProtoCredentialValidationInput
>;

/**
 * Credential validation result schema
 */
export const CredentialValidationResultSchema = z.object({
  valid: z.boolean(),
  expiresAt: z.string().optional(),
  error: z.string().optional(),
});

export type CredentialValidationResult = ProtoBacked<
  z.infer<typeof CredentialValidationResultSchema>,
  ProtoCredentialValidationResult
>;
