import { describe, expect, it } from "vitest";
import {
  CredentialValidationInputSchema,
  OAuthConfigSchema,
  OAuthProviderSchema,
} from "../../extensions/index.js";

describe("oauth extension schema", () => {
  it("accepts SSOT getAuthConfig output with provider metadata", () => {
    const parsed = OAuthConfigSchema.parse({
      authType: "oauth",
      authScope: "channel",
      oauthProvider: {
        provider: "yahoo-shopping",
        authorizationUrl: "https://auth.login.yahoo.co.jp/yconnect/v2/authorization",
        tokenUrl: "https://auth.login.yahoo.co.jp/yconnect/v2/token",
        refreshTokenUrl: "https://auth.login.yahoo.co.jp/yconnect/v2/refresh-token",
        scopes: ["openid", "profile"],
        providerName: "Yahoo! Shopping",
        providerDescription: "Connect a Yahoo! Shopping store account.",
        providerIconUrl: "https://provider.example/icon.png",
        parameterCase: "snake",
        tokenRequestContentType: "json",
        authorizationCodeParamName: "spapi_oauth_code",
        authorizationOpenMode: "currentTab",
        tokenRequest: {
          authorizationCodeParamName: "auth_code",
        },
        tokenResponse: {
          accessTokenPath: "data.access_token",
          refreshTokenPath: "data.refresh_token",
          expiresInPath: "data.expires_in",
          tokenTypePath: "data.token_type",
          refreshTokenExpiresInPath: "data.refresh_token_expires_in",
        },
      },
    });

    expect(parsed.authType).toBe("oauth");
    expect(parsed.authScope).toBe("channel");
    expect(parsed.oauthProvider.provider).toBe("yahoo-shopping");
    expect(parsed.oauthProvider.refreshTokenUrl).toBe(
      "https://auth.login.yahoo.co.jp/yconnect/v2/refresh-token"
    );
    expect(parsed.oauthProvider.tokenRequestContentType).toBe("json");
    expect(parsed.oauthProvider.authorizationCodeParamName).toBe("spapi_oauth_code");
    expect(parsed.oauthProvider.authorizationOpenMode).toBe("currentTab");
    expect(parsed.oauthProvider.tokenRequest?.authorizationCodeParamName).toBe("auth_code");
    expect(parsed.oauthProvider.tokenResponse?.accessTokenPath).toBe("data.access_token");
  });

  it("rejects invalid token response object paths", () => {
    expect(() =>
      OAuthProviderSchema.parse({
        provider: "provider",
        authorizationUrl: "https://provider.example/login",
        tokenUrl: "https://provider.example/token",
        scopes: ["read"],
        providerName: "Provider",
        tokenResponse: { accessTokenPath: "data..access_token" },
      })
    ).toThrow();
  });

  it("rejects empty scopes because AppStore requires provider scopes", () => {
    expect(() =>
      OAuthProviderSchema.parse({
        provider: "provider",
        authorizationUrl: "https://provider.example/login",
        tokenUrl: "https://provider.example/token",
        scopes: [],
        providerName: "Provider",
      })
    ).toThrow();
  });

  it("accepts empty validation params and optional local access token", () => {
    expect(CredentialValidationInputSchema.parse({})).toEqual({});
    expect(CredentialValidationInputSchema.parse({ accessToken: "token" }).accessToken).toBe(
      "token"
    );
  });
});
