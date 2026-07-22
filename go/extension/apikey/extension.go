package apikey

import (
	"context"

	"github.com/channel-io/app-sdk/go/appsdk"
	"github.com/channel-io/app-sdk/go/extension/schemaregistry"
)

type ExtensionBuilder struct {
	getAuthConfig       appsdk.TypedHandlerFunc[GetAuthConfigRequest, AuthConfig]
	validateCredentials appsdk.TypedHandlerFunc[ValidateCredentialsRequest, ValidateCredentialsResponse]
}

func Extension() *ExtensionBuilder {
	return &ExtensionBuilder{}
}

func (b *ExtensionBuilder) GetAuthConfig(handler appsdk.TypedHandlerFunc[GetAuthConfigRequest, AuthConfig]) *ExtensionBuilder {
	b.getAuthConfig = handler
	return b
}

func (b *ExtensionBuilder) ValidateCredentials(handler appsdk.TypedHandlerFunc[ValidateCredentialsRequest, ValidateCredentialsResponse]) *ExtensionBuilder {
	b.validateCredentials = handler
	return b
}

func (b *ExtensionBuilder) Register(app *appsdk.App) error {
	if err := app.DeclareExtension(ExtensionName, SystemVersion); err != nil {
		return err
	}
	if b.getAuthConfig != nil {
		if err := app.RegisterFunc(FunctionGetAuthConfig, schemaregistry.Append(FunctionGetAuthConfig, appsdk.HandleProto(b.getAuthConfig))...); err != nil {
			return err
		}
	}
	if b.validateCredentials != nil {
		if err := app.RegisterFunc(FunctionValidateCredentials, schemaregistry.Append(FunctionValidateCredentials, appsdk.HandleProto(b.validateCredentials))...); err != nil {
			return err
		}
	}
	return nil
}

func StaticAuthConfig(config *AuthConfig) appsdk.TypedHandlerFunc[GetAuthConfigRequest, AuthConfig] {
	return func(context.Context, appsdk.Context, *GetAuthConfigRequest) (*AuthConfig, error) {
		return config, nil
	}
}

func CredentialsFrom(fnCtx appsdk.Context, request *ValidateCredentialsRequest) map[string]string {
	return fnCtx.APICredentials
}

func Valid() *ValidateCredentialsResponse {
	return &ValidateCredentialsResponse{Valid: true}
}

func Invalid(message string) *ValidateCredentialsResponse {
	return &ValidateCredentialsResponse{
		Valid:        false,
		ErrorMessage: message,
	}
}
