package postgres

import (
	"context"

	_ "github.com/jackc/pgx/v5/stdlib"

	"github.com/channel-io/cht-app-sdk/go/datasource/sqlrunner"
)

const DriverName = "pgx"

type Config = sqlrunner.Config
type SourceConfig = sqlrunner.SourceConfig
type Executor = sqlrunner.Executor

func NewExecutor(ctx context.Context, cfg Config) (*Executor, error) {
	if cfg.DefaultDriverName == "" {
		cfg.DefaultDriverName = DriverName
	}
	return sqlrunner.NewExecutor(ctx, cfg)
}
