package gin

import (
	"context"

	"github.com/channel-io/app-sdk/go/appsdk"
	"github.com/channel-io/app-sdk/go/native"
	ginlib "github.com/gin-gonic/gin"
)

// Route mounts the Channel app function endpoint on an existing Gin router.
type Route struct {
	handler *Handler
	route   string
}

func NewRoute(app *appsdk.App, opts ...Option) *Route {
	return newRoute(app, app, opts...)
}

func NewHandlerRoute(handler RequestHandler, opts ...Option) *Route {
	return newRoute(nil, handler, opts...)
}

func newRoute(app *appsdk.App, requestHandler RequestHandler, opts ...Option) *Route {
	cfg := newConfig(opts...)
	return newRouteWithConfig(app, requestHandler, cfg)
}

func newRouteWithConfig(app *appsdk.App, requestHandler RequestHandler, cfg config) *Route {
	return &Route{
		handler: newHandlerWithConfig(app, requestHandler, cfg),
		route:   cfg.route,
	}
}

func (r *Route) Path() string {
	return r.route
}

func (r *Route) Handler() *Handler {
	return r.handler
}

func (r *Route) Mount(router ginlib.IRouter) {
	router.PUT(r.route, r.handler.Handle)
}

func (r *Route) Handle(ctx *ginlib.Context) {
	r.handler.Handle(ctx)
}

func (r *Route) AutoRegister(ctx context.Context) []native.AutoRegisterResult {
	return r.handler.AutoRegister(ctx)
}

func (r *Route) HasAutoRegistrar() bool {
	return r.handler.HasAutoRegistrar()
}
