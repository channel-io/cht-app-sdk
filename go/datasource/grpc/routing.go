package grpcdatasource

import (
	"context"
	"strings"

	"google.golang.org/grpc/metadata"
)

const DatasourceRouteMetadataKey = "x-datasource-route"

type RoutedQueryExecutorOption func(*RoutedQueryExecutor)

type RoutedQueryExecutor struct {
	routes          map[string]QueryExecutor
	defaultExecutor QueryExecutor
}

func NewRoutedQueryExecutor(routes map[string]QueryExecutor, opts ...RoutedQueryExecutorOption) *RoutedQueryExecutor {
	executor := &RoutedQueryExecutor{routes: make(map[string]QueryExecutor, len(routes))}
	for route, routeExecutor := range routes {
		route = strings.TrimSpace(route)
		if route == "" || routeExecutor == nil {
			continue
		}
		executor.routes[route] = routeExecutor
	}
	for _, opt := range opts {
		if opt != nil {
			opt(executor)
		}
	}
	return executor
}

func WithDefaultQueryExecutor(executor QueryExecutor) RoutedQueryExecutorOption {
	return func(r *RoutedQueryExecutor) {
		r.defaultExecutor = executor
	}
}

func (r *RoutedQueryExecutor) ExecuteQuery(ctx context.Context, req QueryRequest, sender QueryChunkSender) error {
	if r == nil {
		return SourceNotFound("datasource route is not configured")
	}
	route := DatasourceRouteFromContext(ctx)
	if route == "" && r.defaultExecutor != nil {
		return r.defaultExecutor.ExecuteQuery(ctx, req, sender)
	}
	executor := r.routes[route]
	if executor == nil {
		if route == "" {
			return SourceNotFound("datasource route is required")
		}
		return SourceNotFound("unknown datasource route: " + route)
	}
	return executor.ExecuteQuery(ctx, req, sender)
}

func DatasourceRouteFromContext(ctx context.Context) string {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return ""
	}
	for _, value := range md.Get(DatasourceRouteMetadataKey) {
		if route := strings.TrimSpace(value); route != "" {
			return route
		}
	}
	return ""
}
