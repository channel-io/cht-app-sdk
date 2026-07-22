package native_test

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/channel-io/app-sdk/go/appsdk"
	"github.com/channel-io/app-sdk/go/native"
)

func TestAutoRegistrarRegistersDeclaredExtensions(t *testing.T) {
	app := appsdk.New(appsdk.Options{AppID: "app-id", AppSecret: "secret"})
	if err := app.DeclareExtension("wms", "v1"); err != nil {
		t.Fatal(err)
	}

	var methods []string
	httpClient := &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		if r.URL.Path != "/general/v1/native/functions" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		var req struct {
			Method string          `json:"method"`
			Params json.RawMessage `json:"params"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatal(err)
		}
		methods = append(methods, req.Method)
		switch req.Method {
		case "issueToken":
			return okJSON(r, `{"result":{"accessToken":"access","refreshToken":"refresh","expiresIn":3600}}`), nil
		case "registerExtension":
			var params struct {
				AppID         string `json:"appId"`
				ExtensionName string `json:"extensionName"`
				SystemVersion string `json:"systemVersion"`
			}
			if err := json.Unmarshal(req.Params, &params); err != nil {
				t.Fatal(err)
			}
			if params.AppID != "app-id" || params.ExtensionName != "wms" || params.SystemVersion != "v1" {
				t.Fatalf("unexpected register params: %+v", params)
			}
			if r.Header.Get("x-access-token") != "access" {
				t.Fatalf("missing access token header: %s", r.Header.Get("x-access-token"))
			}
			return okJSON(r, `{"result":{"success":true}}`), nil
		default:
			t.Fatalf("unexpected method: %s", req.Method)
			return nil, nil
		}
	})}

	client := native.NewClient(native.WithBaseURL("https://app-store.test"), native.WithHTTPClient(httpClient))
	registrar := native.NewAutoRegistrar(native.AutoRegisterConfig{App: app, Client: client})

	var emitted []native.AutoRegisterResult
	registrar = native.NewAutoRegistrar(native.AutoRegisterConfig{
		App:      app,
		Client:   client,
		OnResult: func(results []native.AutoRegisterResult) { emitted = results },
	})
	results := registrar.Register(context.Background())
	if len(results) != 1 || !results[0].Success {
		t.Fatalf("unexpected results: %+v", results)
	}
	if len(emitted) != 1 || !emitted[0].Success {
		t.Fatalf("expected emitted results, got %+v", emitted)
	}
	if len(methods) != 2 || methods[0] != "issueToken" || methods[1] != "registerExtension" {
		t.Fatalf("unexpected native methods: %v", methods)
	}
}

func TestAutoRegistrarUsesCoreFallback(t *testing.T) {
	app := appsdk.New(appsdk.Options{AppID: "app-id", AppSecret: "secret"})
	httpClient := &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		var req struct {
			Method string          `json:"method"`
			Params json.RawMessage `json:"params"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatal(err)
		}
		if req.Method == "issueToken" {
			return okJSON(r, `{"result":{"accessToken":"access","refreshToken":"refresh","expiresIn":3600}}`), nil
		}
		var params struct {
			ExtensionName string `json:"extensionName"`
			SystemVersion string `json:"systemVersion"`
		}
		if err := json.Unmarshal(req.Params, &params); err != nil {
			t.Fatal(err)
		}
		if params.ExtensionName != appsdk.CoreExtensionName || params.SystemVersion != appsdk.DefaultSystemVersion {
			t.Fatalf("unexpected fallback params: %+v", params)
		}
		return okJSON(r, `{"result":{"success":true}}`), nil
	})}

	client := native.NewClient(native.WithBaseURL("https://app-store.test"), native.WithHTTPClient(httpClient))
	results := native.NewAutoRegistrar(native.AutoRegisterConfig{App: app, Client: client}).Register(context.Background())
	if len(results) != 1 || !results[0].Success || results[0].ExtensionName != appsdk.CoreExtensionName {
		t.Fatalf("unexpected fallback results: %+v", results)
	}
}

func TestAutoRegistrarRetriesTransientRegisterFailure(t *testing.T) {
	app := appsdk.New(appsdk.Options{AppID: "app-id", AppSecret: "secret"})
	if err := app.DeclareExtension("config", "v1"); err != nil {
		t.Fatal(err)
	}

	registerCalls := 0
	httpClient := &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		var req struct {
			Method string `json:"method"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatal(err)
		}
		switch req.Method {
		case "issueToken":
			return okJSON(r, `{"result":{"accessToken":"access","refreshToken":"refresh","expiresIn":3600}}`), nil
		case "registerExtension":
			registerCalls++
			if registerCalls == 1 {
				return okJSON(r, `{"result":{"success":false,"errorMessage":"saga register_extension failed at step register_extension: getFunctions failed: App server request failed"}}`), nil
			}
			return okJSON(r, `{"result":{"success":true}}`), nil
		default:
			t.Fatalf("unexpected method: %s", req.Method)
			return nil, nil
		}
	})}

	client := native.NewClient(native.WithBaseURL("https://app-store.test"), native.WithHTTPClient(httpClient))
	var emitted []native.AutoRegisterResult
	registrar := native.NewAutoRegistrar(native.AutoRegisterConfig{
		App:            app,
		Client:         client,
		MaxAttempts:    2,
		InitialBackoff: time.Nanosecond,
		OnResult:       func(results []native.AutoRegisterResult) { emitted = results },
	})

	results := registrar.Register(context.Background())
	if registerCalls != 2 {
		t.Fatalf("expected registerExtension retry, got %d calls", registerCalls)
	}
	if len(results) != 1 || !results[0].Success {
		t.Fatalf("unexpected final results: %+v", results)
	}
	if len(emitted) != 1 || !emitted[0].Success {
		t.Fatalf("expected final emitted success, got %+v", emitted)
	}
}

func TestAutoRegistrarReturnsLastFailureWhenRetriesExhausted(t *testing.T) {
	app := appsdk.New(appsdk.Options{AppID: "app-id", AppSecret: "secret"})
	if err := app.DeclareExtension("config", "v1"); err != nil {
		t.Fatal(err)
	}

	registerCalls := 0
	httpClient := &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		var req struct {
			Method string `json:"method"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatal(err)
		}
		switch req.Method {
		case "issueToken":
			return okJSON(r, `{"result":{"accessToken":"access","refreshToken":"refresh","expiresIn":3600}}`), nil
		case "registerExtension":
			registerCalls++
			return okJSON(r, `{"result":{"success":false,"errorMessage":"still starting"}}`), nil
		default:
			t.Fatalf("unexpected method: %s", req.Method)
			return nil, nil
		}
	})}

	client := native.NewClient(native.WithBaseURL("https://app-store.test"), native.WithHTTPClient(httpClient))
	results := native.NewAutoRegistrar(native.AutoRegisterConfig{
		App:            app,
		Client:         client,
		MaxAttempts:    2,
		InitialBackoff: time.Nanosecond,
	}).Register(context.Background())

	if registerCalls != 2 {
		t.Fatalf("expected retries to exhaust, got %d calls", registerCalls)
	}
	if len(results) != 1 || results[0].Success || results[0].Error != "still starting" {
		t.Fatalf("unexpected exhausted results: %+v", results)
	}
}

func okJSON(req *http.Request, body string) *http.Response {
	return &http.Response{
		StatusCode: http.StatusOK,
		Body:       io.NopCloser(strings.NewReader(body)),
		Header:     make(http.Header),
		Request:    req,
	}
}
