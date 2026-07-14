package grpcdatasource

import (
	"context"
	"crypto/sha256"
	"crypto/subtle"
	stderrors "errors"
	"fmt"
	"log/slog"
	"net"
	"strings"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/health"
	healthgrpc "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/status"
)

const (
	DefaultGracefulStopTimeout = 10 * time.Second
	DefaultMaxMessageSize      = 64 * 1024 * 1024
)

type StopHook func(ctx context.Context) error

type ManagedServerConfig struct {
	Enabled              bool
	Port                 string
	AuthToken            string
	SigningKey           string
	SigningKeyResolver   SigningKeyResolver
	AccessTokenValidator AccessTokenValidator
	AuthRequired         bool
	Logger               *slog.Logger
	StopHooks            []StopHook
	GracefulStopTimeout  time.Duration
	MaxRecvMessageSize   int
	MaxSendMessageSize   int
	ServerOptions        []Option
}

type ManagedServer struct {
	enabled              bool
	port                 string
	auth                 datasourceAuth
	signingKey           string
	signingKeyResolver   SigningKeyResolver
	accessTokenValidator AccessTokenValidator
	authRequired         bool
	server               *grpc.Server
	health               *health.Server
	stopHooks            []StopHook
	gracefulStopTimeout  time.Duration
	logger               *slog.Logger
}

func NewManagedServer(handler ExecuteQueryHandler, cfg ManagedServerConfig) *ManagedServer {
	logger := cfg.Logger
	if logger == nil {
		logger = slog.Default()
	}
	recvSize := cfg.MaxRecvMessageSize
	if recvSize <= 0 {
		recvSize = DefaultMaxMessageSize
	}
	sendSize := cfg.MaxSendMessageSize
	if sendSize <= 0 {
		sendSize = DefaultMaxMessageSize
	}
	timeout := cfg.GracefulStopTimeout
	if timeout <= 0 {
		timeout = DefaultGracefulStopTimeout
	}

	grpcServer := grpc.NewServer(
		grpc.MaxRecvMsgSize(recvSize),
		grpc.MaxSendMsgSize(sendSize),
	)
	managed := &ManagedServer{
		enabled:              cfg.Enabled,
		port:                 strings.TrimSpace(cfg.Port),
		auth:                 newDatasourceAuth(cfg.AuthToken),
		signingKey:           strings.TrimSpace(cfg.SigningKey),
		signingKeyResolver:   cfg.SigningKeyResolver,
		accessTokenValidator: cfg.AccessTokenValidator,
		authRequired:         cfg.AuthRequired,
		server:               grpcServer,
		health:               health.NewServer(),
		stopHooks:            append([]StopHook(nil), cfg.StopHooks...),
		gracefulStopTimeout:  timeout,
		logger:               logger,
	}

	options := append([]Option(nil), cfg.ServerOptions...)
	Register(grpcServer, NewServer(managed.withAuth(handler), options...))
	healthgrpc.RegisterHealthServer(grpcServer, managed.health)
	managed.health.SetServingStatus("", healthgrpc.HealthCheckResponse_SERVING)
	managed.health.SetServingStatus(ServiceName, healthgrpc.HealthCheckResponse_SERVING)
	return managed
}

func (s *ManagedServer) Start(ctx context.Context) error {
	if s == nil {
		return nil
	}
	if !s.enabled {
		s.logger.InfoContext(ctx, "Skipping datasource gRPC server because it is disabled")
		return nil
	}
	if s.port == "" {
		return fmt.Errorf("datasource gRPC port is required when server is enabled")
	}
	if s.authRequired && !s.auth.enabled && s.signingKey == "" && s.signingKeyResolver == nil && s.accessTokenValidator == nil {
		return fmt.Errorf("datasource gRPC auth is required")
	}

	listener, err := net.Listen("tcp", ":"+s.port)
	if err != nil {
		return err
	}
	s.logger.InfoContext(ctx, "Starting datasource gRPC server", "port", s.port)
	go func() {
		if err := s.server.Serve(listener); err != nil && !stderrors.Is(err, grpc.ErrServerStopped) {
			s.logger.ErrorContext(ctx, "Datasource gRPC server stopped with error", "err", err)
		}
	}()
	return nil
}

func (s *ManagedServer) Stop(ctx context.Context) error {
	if s == nil {
		return nil
	}
	if s.enabled {
		if s.health != nil {
			s.health.SetServingStatus("", healthgrpc.HealthCheckResponse_NOT_SERVING)
			s.health.SetServingStatus(ServiceName, healthgrpc.HealthCheckResponse_NOT_SERVING)
		}
		stopped := make(chan struct{})
		go func() {
			s.server.GracefulStop()
			close(stopped)
		}()

		timeout := time.NewTimer(s.gracefulStopTimeout)
		defer timeout.Stop()
		select {
		case <-stopped:
		case <-ctx.Done():
			s.server.Stop()
			return ctx.Err()
		case <-timeout.C:
			s.server.Stop()
		}
	}
	return s.runStopHooks(ctx)
}

func (s *ManagedServer) runStopHooks(ctx context.Context) error {
	for _, hook := range s.stopHooks {
		if hook == nil {
			continue
		}
		if err := hook(ctx); err != nil {
			return err
		}
	}
	return nil
}

func (s *ManagedServer) withAuth(handler ExecuteQueryHandler) ExecuteQueryHandler {
	return func(req *ExecuteQueryRequest, stream ExecuteQueryServer) error {
		if s.signingKey != "" || s.signingKeyResolver != nil || s.accessTokenValidator != nil {
			authenticatedStream, err := s.withAccessTokenIdentity(req, stream)
			if err != nil {
				return SendErrorAndReturn(stream, err)
			}
			stream = authenticatedStream
		} else if !s.auth.valid(req.GetSession()) {
			return SendErrorAndReturn(stream, status.Error(codes.Unauthenticated, "invalid datasource gRPC token"))
		}
		if handler == nil {
			return SendErrorAndReturn(stream, status.Error(codes.Unimplemented, "ExecuteQuery handler is not configured"))
		}
		return handler(req, stream)
	}
}

func (s *ManagedServer) withAccessTokenIdentity(req *ExecuteQueryRequest, stream ExecuteQueryServer) (ExecuteQueryServer, error) {
	token := AccessTokenFromContext(stream.Context())
	if token == "" {
		return nil, status.Error(codes.Unauthenticated, "missing datasource access token")
	}
	identity, parsed, err := s.parseAccessTokenIdentity(token)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "invalid datasource access token")
	}
	signingKey, err := s.signingKeyFor(stream.Context(), identity)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "invalid datasource signing key")
	}
	if signingKey != "" {
		signature := SignatureFromContext(stream.Context())
		if signature == "" {
			return nil, status.Error(codes.Unauthenticated, "missing datasource signature")
		}
		if !VerifyDataSourceSignature(signature, signingKey, req, token) {
			return nil, status.Error(codes.Unauthenticated, "invalid datasource signature")
		}
	}

	if s.accessTokenValidator != nil {
		identity, err = s.accessTokenValidator.ValidateAccessToken(stream.Context(), token)
		if err != nil {
			return nil, status.Error(codes.Unauthenticated, "invalid datasource access token")
		}
	} else if !parsed {
		return nil, status.Error(codes.Unauthenticated, "invalid datasource access token")
	}
	return executeQueryServerWithContext{
		ExecuteQueryServer: stream,
		ctx:                ContextWithAccessTokenIdentity(stream.Context(), identity),
	}, nil
}

func (s *ManagedServer) parseAccessTokenIdentity(token string) (AccessTokenIdentity, bool, error) {
	if s.signingKey != "" || s.signingKeyResolver != nil || s.accessTokenValidator == nil {
		identity, err := ParseJWTAccessTokenUnverified(token)
		return identity, err == nil, err
	}
	return AccessTokenIdentity{}, false, nil
}

func (s *ManagedServer) signingKeyFor(ctx context.Context, identity AccessTokenIdentity) (string, error) {
	if s.signingKeyResolver != nil {
		key, err := s.signingKeyResolver(ctx, identity)
		if err != nil {
			return "", err
		}
		return strings.TrimSpace(key), nil
	}
	return s.signingKey, nil
}

type executeQueryServerWithContext struct {
	ExecuteQueryServer
	ctx context.Context
}

func (s executeQueryServerWithContext) Context() context.Context {
	return s.ctx
}

type datasourceAuth struct {
	enabled bool
	sum     [sha256.Size]byte
}

func newDatasourceAuth(token string) datasourceAuth {
	token = strings.TrimSpace(token)
	if token == "" {
		return datasourceAuth{}
	}
	return datasourceAuth{enabled: true, sum: sha256.Sum256([]byte(token))}
}

func (a datasourceAuth) valid(session *SessionContext) bool {
	if !a.enabled {
		return true
	}
	token := ""
	if session != nil {
		token = session.GetDatasourceToken()
	}
	sum := sha256.Sum256([]byte(token))
	return subtle.ConstantTimeCompare(sum[:], a.sum[:]) == 1
}
