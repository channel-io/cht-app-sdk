package native

import (
	"context"
	"fmt"
	"time"

	"github.com/channel-io/app-sdk/go/appsdk"
)

const (
	DefaultAutoRegisterMaxAttempts    = 3
	DefaultAutoRegisterInitialBackoff = time.Second
	DefaultAutoRegisterMaxBackoff     = 5 * time.Second
)

type AutoRegisterConfig struct {
	App            *appsdk.App
	Targets        []appsdk.ExtensionRegistration
	AppID          string
	AppSecret      string
	AppStoreURL    string
	Client         *Client
	TokenManager   *TokenManager
	OnResult       func([]AutoRegisterResult)
	MaxAttempts    int
	InitialBackoff time.Duration
	MaxBackoff     time.Duration
}

type AutoRegisterResult struct {
	ExtensionName string
	SystemVersion string
	Success       bool
	Error         string
}

type AutoRegistrar struct {
	appID          string
	targets        []appsdk.ExtensionRegistration
	client         *Client
	tokenManager   *TokenManager
	onResult       func([]AutoRegisterResult)
	maxAttempts    int
	initialBackoff time.Duration
	maxBackoff     time.Duration
}

func NewAutoRegistrar(config AutoRegisterConfig) *AutoRegistrar {
	appID := config.AppID
	appSecret := config.AppSecret
	if config.App != nil {
		if appID == "" {
			appID = config.App.Options().AppID
		}
		if appSecret == "" {
			appSecret = config.App.Options().AppSecret
		}
	}

	client := config.Client
	if client == nil {
		opts := []Option{}
		if config.AppStoreURL != "" {
			opts = append(opts, WithBaseURL(config.AppStoreURL))
		}
		client = NewClient(opts...)
	}

	tokenManager := config.TokenManager
	if tokenManager == nil {
		tokenManager = NewTokenManager(TokenManagerConfig{
			AppID:       appID,
			AppSecret:   appSecret,
			AppStoreURL: config.AppStoreURL,
			Client:      client,
		})
	} else if config.Client == nil {
		client = tokenManager.Client()
	}

	targets := config.Targets
	if len(targets) == 0 && config.App != nil {
		targets = config.App.AutoRegisterTargets()
	}
	if len(targets) == 0 {
		targets = []appsdk.ExtensionRegistration{{
			Name:          appsdk.CoreExtensionName,
			SystemVersion: appsdk.DefaultSystemVersion,
		}}
	}

	maxAttempts := config.MaxAttempts
	if maxAttempts <= 0 {
		maxAttempts = DefaultAutoRegisterMaxAttempts
	}
	initialBackoff := config.InitialBackoff
	if initialBackoff <= 0 {
		initialBackoff = DefaultAutoRegisterInitialBackoff
	}
	maxBackoff := config.MaxBackoff
	if maxBackoff <= 0 {
		maxBackoff = DefaultAutoRegisterMaxBackoff
	}

	return &AutoRegistrar{
		appID:          appID,
		targets:        targets,
		client:         client,
		tokenManager:   tokenManager,
		onResult:       config.OnResult,
		maxAttempts:    maxAttempts,
		initialBackoff: initialBackoff,
		maxBackoff:     maxBackoff,
	}
}

func (r *AutoRegistrar) Register(ctx context.Context) []AutoRegisterResult {
	if r.appID == "" {
		results := r.failedResults("appId is required")
		r.emit(results)
		return results
	}

	var results []AutoRegisterResult
	backoff := r.initialBackoff
	for attempt := 1; attempt <= r.maxAttempts; attempt++ {
		results = r.registerOnce(ctx)
		if autoRegisterSucceeded(results) || attempt == r.maxAttempts {
			r.emit(results)
			return results
		}
		if !sleep(ctx, backoff) {
			r.emit(results)
			return results
		}
		backoff = nextBackoff(backoff, r.maxBackoff)
	}

	r.emit(results)
	return results
}

func (r *AutoRegistrar) registerOnce(ctx context.Context) []AutoRegisterResult {
	results := make([]AutoRegisterResult, 0, len(r.targets))
	token, err := r.tokenManager.GetAppToken(ctx)
	if err != nil {
		return r.failedResults(fmt.Sprintf("failed to issue app token: %v", err))
	}

	for _, target := range r.targets {
		result := AutoRegisterResult{
			ExtensionName: target.Name,
			SystemVersion: target.SystemVersion,
		}
		resp, err := r.client.RegisterExtension(ctx, token.AccessToken, r.appID, target.Name, target.SystemVersion)
		if err != nil {
			result.Error = err.Error()
			results = append(results, result)
			continue
		}
		if !resp.Success {
			result.Error = resp.ErrorMessage
			if result.Error == "" && len(resp.ValidationErrors) > 0 {
				result.Error = fmt.Sprintf("%v", resp.ValidationErrors)
			}
			if result.Error == "" {
				result.Error = "unknown auto-register error"
			}
			results = append(results, result)
			continue
		}
		result.Success = true
		results = append(results, result)
	}

	return results
}

func autoRegisterSucceeded(results []AutoRegisterResult) bool {
	if len(results) == 0 {
		return false
	}
	for _, result := range results {
		if !result.Success {
			return false
		}
	}
	return true
}

func sleep(ctx context.Context, delay time.Duration) bool {
	if delay <= 0 {
		return true
	}
	timer := time.NewTimer(delay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-timer.C:
		return true
	}
}

func nextBackoff(current, max time.Duration) time.Duration {
	if current <= 0 {
		return 0
	}
	if max > 0 && current >= max {
		return max
	}
	next := current * 2
	if max > 0 && next > max {
		return max
	}
	if next < current {
		return max
	}
	return next
}

func (r *AutoRegistrar) failedResults(message string) []AutoRegisterResult {
	results := make([]AutoRegisterResult, 0, len(r.targets))
	for _, target := range r.targets {
		results = append(results, AutoRegisterResult{
			ExtensionName: target.Name,
			SystemVersion: target.SystemVersion,
			Error:         message,
		})
	}
	return results
}

func (r *AutoRegistrar) emit(results []AutoRegisterResult) {
	if r.onResult != nil {
		r.onResult(results)
	}
}
