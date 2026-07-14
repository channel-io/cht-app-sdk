package native

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestTokenManagerUsesCachedToken(t *testing.T) {
	var issueCalls int32
	client := tokenClient(t, func(method string) IssueTokenResponse {
		if method == "issueToken" {
			atomic.AddInt32(&issueCalls, 1)
		}
		return IssueTokenResponse{AccessToken: "access", RefreshToken: "refresh", ExpiresIn: 3600}
	})

	manager := NewTokenManager(TokenManagerConfig{
		AppID:         "app",
		AppSecret:     "secret",
		Client:        client,
		RefreshBuffer: time.Minute,
	})

	first, err := manager.GetAppToken(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	second, err := manager.GetAppToken(context.Background())
	if err != nil {
		t.Fatal(err)
	}

	if first.AccessToken != second.AccessToken {
		t.Fatalf("expected cached token, got %q and %q", first.AccessToken, second.AccessToken)
	}
	if got := atomic.LoadInt32(&issueCalls); got != 1 {
		t.Fatalf("expected one issueToken call, got %d", got)
	}
}

func TestTokenManagerRefreshesExpiringToken(t *testing.T) {
	var issueCalls int32
	var refreshCalls int32
	client := tokenClient(t, func(method string) IssueTokenResponse {
		switch method {
		case "issueToken":
			atomic.AddInt32(&issueCalls, 1)
			return IssueTokenResponse{AccessToken: "access-old", RefreshToken: "refresh-old", ExpiresIn: 1}
		case "refreshToken":
			atomic.AddInt32(&refreshCalls, 1)
			return IssueTokenResponse{AccessToken: "access-new", RefreshToken: "refresh-new", ExpiresIn: 3600}
		default:
			t.Fatalf("unexpected method %s", method)
			return IssueTokenResponse{}
		}
	})

	manager := NewTokenManager(TokenManagerConfig{
		AppID:         "app",
		AppSecret:     "secret",
		Client:        client,
		RefreshBuffer: time.Minute,
	})

	if _, err := manager.GetAppToken(context.Background()); err != nil {
		t.Fatal(err)
	}
	token, err := manager.GetAppToken(context.Background())
	if err != nil {
		t.Fatal(err)
	}

	if token.AccessToken != "access-new" {
		t.Fatalf("expected refreshed token, got %q", token.AccessToken)
	}
	if atomic.LoadInt32(&issueCalls) != 1 || atomic.LoadInt32(&refreshCalls) != 1 {
		t.Fatalf("expected one issue and one refresh, got issue=%d refresh=%d", issueCalls, refreshCalls)
	}
}

func TestTokenManagerDeduplicatesConcurrentRequests(t *testing.T) {
	var issueCalls int32
	client := tokenClient(t, func(method string) IssueTokenResponse {
		if method != "issueToken" {
			t.Fatalf("unexpected method %s", method)
		}
		atomic.AddInt32(&issueCalls, 1)
		time.Sleep(25 * time.Millisecond)
		return IssueTokenResponse{AccessToken: "access", RefreshToken: "refresh", ExpiresIn: 3600}
	})

	manager := NewTokenManager(TokenManagerConfig{
		AppID:         "app",
		AppSecret:     "secret",
		Client:        client,
		RefreshBuffer: time.Minute,
	})

	var wg sync.WaitGroup
	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			token, err := manager.GetAppToken(context.Background())
			if err != nil {
				t.Error(err)
				return
			}
			if token.AccessToken != "access" {
				t.Errorf("unexpected token %q", token.AccessToken)
			}
		}()
	}
	wg.Wait()

	if got := atomic.LoadInt32(&issueCalls); got != 1 {
		t.Fatalf("expected one issueToken call, got %d", got)
	}
}

func tokenClient(t *testing.T, handler func(method string) IssueTokenResponse) *Client {
	t.Helper()

	return NewClient(
		WithBaseURL("https://app-store.test"),
		WithHTTPClient(&http.Client{
			Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
				if r.Method != http.MethodPut {
					t.Fatalf("expected PUT, got %s", r.Method)
				}

				var req struct {
					Method string `json:"method"`
				}
				if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
					t.Fatalf("failed to decode request: %v", err)
				}

				var body bytes.Buffer
				if err := json.NewEncoder(&body).Encode(map[string]any{
					"result": handler(req.Method),
				}); err != nil {
					t.Fatalf("failed to encode response: %v", err)
				}

				return &http.Response{
					StatusCode: http.StatusOK,
					Header:     http.Header{"Content-Type": []string{"application/json"}},
					Body:       io.NopCloser(&body),
					Request:    r,
				}, nil
			}),
		}),
	)
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req)
}
