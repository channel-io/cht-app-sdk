/* eslint-disable @typescript-eslint/require-await */
import { z } from "zod";
import {
  CredentialValidationInputSchema,
  CredentialValidationResultSchema,
  OAuthConfigSchema,
  type Context,
  type CredentialValidationInput,
  type CredentialValidationResult,
  type OAuthConfig,
} from "@channel.io/app-sdk-core";
import {
  Extension,
  Func,
  Description,
  InputSchema,
  OutputSchema,
  Ctx,
  Input,
} from "@channel.io/app-sdk-server";

// Input/Output schemas
const EmptyInput = z.object({});

/**
 * OAuth extension for calendar provider authentication
 */
@Extension({ name: "oauth", systemVersion: "v1" })
export class OAuthExtension {
  /**
   * Get OAuth configuration for the calendar provider
   */
  @Func("metadata.getAuthConfig")
  @Description("Get OAuth 2.0 authentication configuration")
  @InputSchema(EmptyInput)
  @OutputSchema(OAuthConfigSchema)
  async getAuthConfig(
    @Ctx() _ctx: Context,
    @Input() _params: z.infer<typeof EmptyInput>
  ): Promise<OAuthConfig> {
    // Client ID/secret are managed in AppStore, not returned from getAuthConfig.
    return {
      authType: "oauth",
      authScope: "manager",
      oauthProvider: {
        provider: "google",
        authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: [
          "https://www.googleapis.com/auth/calendar.readonly",
          "https://www.googleapis.com/auth/calendar.events",
        ],
        providerName: "Google Calendar",
      },
    };
  }

  /**
   * Validate stored OAuth credentials
   */
  @Func("validation.validateCredentials")
  @Description("Validate OAuth credentials are still valid")
  @InputSchema(CredentialValidationInputSchema)
  @OutputSchema(CredentialValidationResultSchema)
  async validateCredentials(
    @Ctx() ctx: Context,
    @Input() params: CredentialValidationInput
  ): Promise<CredentialValidationResult> {
    // In a real app, you would:
    // 1. Read the token AppStore injects after token exchange
    // 2. Call the provider API to verify it
    console.log(`[OAuth] Validating credentials for channel: ${ctx.channel.id}`);

    const accessToken = ctx.authToken ?? params.accessToken;
    if (!accessToken) {
      return { valid: false, error: "Missing OAuth access token" };
    }

    // Mock validation - always return valid for demo
    return {
      valid: true,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    };
  }
}
