package server

import (
	"context"
	"time"

	"github.com/channel-io/cht-app-sdk/go/appsdk"
	"github.com/channel-io/cht-app-sdk/go/native"
	sdkgin "github.com/channel-io/cht-app-sdk/go/server/gin"
)

type Option func(*config)

type AutoRegisterOption = sdkgin.AutoRegisterOption

type RequestContextFunc = sdkgin.RequestContextFunc

type Server struct {
	gin  *sdkgin.Server
	addr string
}

type config struct {
	addr string
	opts []sdkgin.Option
}

func New(app *appsdk.App, opts ...Option) *Server {
	cfg := newConfig(opts...)
	return &Server{
		gin:  sdkgin.NewServer(app, cfg.opts...),
		addr: cfg.addr,
	}
}

func Run(app *appsdk.App, opts ...Option) error {
	return New(app, opts...).Run()
}

func (s *Server) Run() error {
	return s.gin.Run(s.addr)
}

func (s *Server) AutoRegister(ctx context.Context) []native.AutoRegisterResult {
	return s.gin.AutoRegister(ctx)
}

func WithAddr(addr string) Option {
	return func(c *config) {
		c.addr = addr
	}
}

func WithRoute(route string) Option {
	return ginOption(sdkgin.WithRoute(route))
}

func WithSignature(signingKey string) Option {
	return ginOption(sdkgin.WithSignature(signingKey))
}

func WithSignatureError(status int, body any) Option {
	return ginOption(sdkgin.WithSignatureError(status, body))
}

func WithRequestContext(fn RequestContextFunc) Option {
	return ginOption(sdkgin.WithRequestContext(fn))
}

func WithAutoRegister(opts ...AutoRegisterOption) Option {
	return ginOption(sdkgin.WithAutoRegister(opts...))
}

func WithAutoRegisterConfig(config native.AutoRegisterConfig) Option {
	return ginOption(sdkgin.WithAutoRegisterConfig(config))
}

func WithAutoRegisterClient(client *native.Client) AutoRegisterOption {
	return sdkgin.WithAutoRegisterClient(client)
}

func WithAutoRegisterTokenManager(tokenManager *native.TokenManager) AutoRegisterOption {
	return sdkgin.WithAutoRegisterTokenManager(tokenManager)
}

func WithAutoRegisterResult(handler func([]native.AutoRegisterResult)) AutoRegisterOption {
	return sdkgin.WithAutoRegisterResult(handler)
}

func WithAppStoreURL(appStoreURL string) AutoRegisterOption {
	return sdkgin.WithAppStoreURL(appStoreURL)
}

func WithAutoRegisterDelay(delay time.Duration) Option {
	return ginOption(sdkgin.WithAutoRegisterDelay(delay))
}

func WithAutoRegisterRetry(maxAttempts int, initialBackoff time.Duration) Option {
	return ginOption(sdkgin.WithAutoRegisterRetry(maxAttempts, initialBackoff))
}

func newConfig(opts ...Option) config {
	cfg := config{addr: ":8080"}
	for _, opt := range opts {
		if opt != nil {
			opt(&cfg)
		}
	}
	return cfg
}

func ginOption(opt sdkgin.Option) Option {
	return func(c *config) {
		if opt != nil {
			c.opts = append(c.opts, opt)
		}
	}
}
