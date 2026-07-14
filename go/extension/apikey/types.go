package apikey

import sdkv1 "github.com/channel-io/cht-app-sdk/go/internal/gen/channel/app/sdk/v1"

const (
	ExtensionName = "apikey"
	SystemVersion = "v1"

	FunctionGetAuthConfig       = "extension.apikey.metadata.getAuthConfig"
	FunctionValidateCredentials = "extension.apikey.validation.validateCredentials"

	AuthTypeAPIKey = "apiKey"

	AuthScopeChannel = "channel"
	AuthScopeManager = "manager"

	MaskTypeFull    = "full"
	MaskTypePartial = "partial"
)

type GetAuthConfigRequest = sdkv1.ApiKeyGetAuthConfigInput
type AuthConfig = sdkv1.ApiKeyGetAuthConfigOutput
type Field = sdkv1.ApiKeyField
type ValidateCredentialsRequest = sdkv1.ApiKeyValidateCredentialsInput
type ValidateCredentialsResponse = sdkv1.ApiKeyValidateCredentialsOutput
type UserInfo = sdkv1.ApiKeyUserInfo
