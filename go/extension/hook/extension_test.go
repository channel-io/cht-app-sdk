package hook

import (
	"context"
	"testing"

	"github.com/channel-io/cht-app-sdk/go/appsdk"
)

func TestStaticWebhookHooks(t *testing.T) {
	handler := StaticHooks(&Config{
		Type:               TypeWebhookReceived,
		ActionFunctionName: "hooks.bcart.receive",
		SystemVersion:      "v1",
		TargetId:           "bcart.orders",
		Webhook: &WebhookConfig{
			EndpointToken: "0123456789abcdef0123456789abcdef",
		},
	})

	response, err := handler(context.Background(), appsdk.Context{}, &GetHooksRequest{})
	if err != nil {
		t.Fatalf("StaticHooks returned an error: %v", err)
	}
	if len(response.Hooks) != 1 {
		t.Fatalf("expected one hook, got %d", len(response.Hooks))
	}
	hook := response.Hooks[0]
	if hook.Type != TypeWebhookReceived || hook.TargetId != "bcart.orders" {
		t.Fatalf("unexpected webhook hook: %#v", hook)
	}
	if hook.Webhook == nil || hook.Webhook.EndpointToken == "" {
		t.Fatal("expected a webhook endpoint token")
	}
}
