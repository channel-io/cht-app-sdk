package gin

import (
	"context"
	"net"

	"github.com/channel-io/cht-app-sdk/go/appsdk"
	"github.com/channel-io/cht-app-sdk/go/native"
	ginlib "github.com/gin-gonic/gin"
)

type Server struct {
	engine *ginlib.Engine
	route  *Route
}

func NewServer(app *appsdk.App, opts ...Option) *Server {
	cfg := newConfig(opts...)
	engine := cfg.engine
	if engine == nil {
		engine = ginlib.Default()
	}
	route := newRouteWithConfig(app, app, cfg)
	server := &Server{
		engine: engine,
		route:  route,
	}
	server.Mount(engine)
	return server
}

func (s *Server) Engine() *ginlib.Engine {
	return s.engine
}

func (s *Server) Handler() *Handler {
	return s.route.Handler()
}

func (s *Server) Route() *Route {
	return s.route
}

func (s *Server) Mount(router ginlib.IRouter) {
	s.route.Mount(router)
}

func (s *Server) AutoRegister(ctx context.Context) []native.AutoRegisterResult {
	return s.route.AutoRegister(ctx)
}

func (s *Server) Run(addr string) error {
	if addr == "" {
		addr = ":8080"
	}
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		return err
	}
	if s.route.HasAutoRegistrar() {
		go s.route.AutoRegister(context.Background())
	}
	return s.engine.RunListener(listener)
}
