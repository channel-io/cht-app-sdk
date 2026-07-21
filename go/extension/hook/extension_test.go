package hook

import (
	"context"
	"strings"
	"testing"

	"github.com/channel-io/cht-app-sdk/go/appsdk"
)

func TestStaticWebhookHooks(t *testing.T) {
	endpointToken := strings.Repeat("a", 32)
	handler := StaticHooks(&Config{
		Type:               TypeWebhookReceived,
		ActionFunctionName: "hooks.bcart.receive",
		SystemVersion:      "v1",
		TargetId:           "bcart.orders",
		Webhook: &WebhookConfig{
			EndpointToken: endpointToken,
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
	if hook.Webhook == nil || hook.Webhook.EndpointToken != endpointToken {
		t.Fatalf("expected webhook endpoint token %q, got %#v", endpointToken, hook.Webhook)
	}
}
