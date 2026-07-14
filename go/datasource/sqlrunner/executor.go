package sqlrunner

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/channel-io/cht-app-sdk/go/datasource"
	"github.com/channel-io/cht-app-sdk/go/datasource/arrowipc"
	grpcdatasource "github.com/channel-io/cht-app-sdk/go/datasource/grpc"
)

const DefaultBatchSize = 1024

type Config struct {
	Sources           []SourceConfig
	DefaultDriverName string
	PingOnStart       bool
}

type SourceConfig struct {
	SourceID   string
	DB         *sql.DB
	DriverName string
	DSN        string
	DSNEnv     string
	Tables     []datasource.TableConfig
	BatchSize  int
}

type Executor struct {
	sources map[string]source
}

type source struct {
	cfg     SourceConfig
	db      *sql.DB
	closeDB bool
}

func NewExecutor(ctx context.Context, cfg Config) (*Executor, error) {
	if len(cfg.Sources) == 0 {
		return nil, fmt.Errorf("at least one SQL datasource source is required")
	}
	executor := &Executor{sources: make(map[string]source, len(cfg.Sources))}
	for _, sourceCfg := range cfg.Sources {
		normalized, err := normalizeSourceConfig(sourceCfg, cfg.DefaultDriverName)
		if err != nil {
			_ = executor.Close()
			return nil, err
		}
		if _, exists := executor.sources[normalized.SourceID]; exists {
			_ = executor.Close()
			return nil, fmt.Errorf("duplicate datasource source_id: %s", normalized.SourceID)
		}
		db := normalized.DB
		closeDB := false
		if db == nil {
			db, err = sql.Open(normalized.DriverName, normalized.DSN)
			if err != nil {
				_ = executor.Close()
				return nil, err
			}
			closeDB = true
		}
		if cfg.PingOnStart {
			if err := db.PingContext(ctx); err != nil {
				if closeDB {
					_ = db.Close()
				}
				_ = executor.Close()
				return nil, err
			}
		}
		executor.sources[normalized.SourceID] = source{
			cfg:     normalized,
			db:      db,
			closeDB: closeDB,
		}
	}
	return executor, nil
}

func (e *Executor) ExecuteQuery(ctx context.Context, req grpcdatasource.QueryRequest, sender grpcdatasource.QueryChunkSender) error {
	if e == nil {
		return grpcdatasource.Internal("SQL datasource executor is not configured")
	}
	source, ok := e.sources[strings.TrimSpace(req.SourceID)]
	if !ok {
		return grpcdatasource.SourceNotFound(fmt.Sprintf("unknown datasource source_id: %s", req.SourceID))
	}
	if err := datasource.ValidateReadOnlyQuery(req.Query, nil, source.cfg.Tables); err != nil {
		return grpcdatasource.InvalidArgument(err.Error())
	}
	if req.TimeoutMS > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, time.Duration(req.TimeoutMS)*time.Millisecond)
		defer cancel()
	}

	startedAt := time.Now()
	rows, err := source.db.QueryContext(ctx, datasource.QueryWithRowLimit(req.Query, req.RowLimit))
	if err != nil {
		return err
	}
	defer rows.Close()

	limitedSender := &byteLimitSender{sender: sender, limit: req.ByteLimit}
	rowCount, err := StreamRows(ctx, rows, limitedSender, StreamRowsOptions{
		BatchSize: source.cfg.BatchSize,
	})
	if err != nil {
		return err
	}
	if err := rows.Err(); err != nil {
		return err
	}
	return limitedSender.SendExecutionResult(grpcdatasource.ExecutionResult{
		RowCount:    rowCount,
		ExecutionMS: time.Since(startedAt).Milliseconds(),
	})
}

func (e *Executor) Close() error {
	if e == nil {
		return nil
	}
	var closeErr error
	for sourceID, source := range e.sources {
		if source.closeDB && source.db != nil {
			if err := source.db.Close(); err != nil && closeErr == nil {
				closeErr = fmt.Errorf("close datasource source %s: %w", sourceID, err)
			}
		}
	}
	return closeErr
}

func normalizeSourceConfig(cfg SourceConfig, defaultDriverName string) (SourceConfig, error) {
	cfg.SourceID = strings.TrimSpace(cfg.SourceID)
	if cfg.SourceID == "" {
		return SourceConfig{}, fmt.Errorf("source_id is required")
	}
	if cfg.BatchSize <= 0 {
		cfg.BatchSize = DefaultBatchSize
	}
	if cfg.DB != nil {
		return cfg, nil
	}
	cfg.DriverName = strings.TrimSpace(firstNonEmpty(cfg.DriverName, defaultDriverName))
	if cfg.DriverName == "" {
		return SourceConfig{}, fmt.Errorf("SQL driver name is required for source_id %s", cfg.SourceID)
	}
	if cfg.DSN == "" && strings.TrimSpace(cfg.DSNEnv) != "" {
		cfg.DSN = os.Getenv(strings.TrimSpace(cfg.DSNEnv))
	}
	cfg.DSN = strings.TrimSpace(cfg.DSN)
	if cfg.DSN == "" {
		return SourceConfig{}, fmt.Errorf("SQL DSN is required for source_id %s", cfg.SourceID)
	}
	return cfg, nil
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

type byteLimitSender struct {
	sender grpcdatasource.QueryChunkSender
	limit  int64
	sent   int64
}

func (s *byteLimitSender) SendArrowSchema(serializedSchema []byte) error {
	if err := s.reserve(len(serializedSchema)); err != nil {
		return err
	}
	return s.sender.SendArrowSchema(serializedSchema)
}

func (s *byteLimitSender) SendArrowRecordBatch(serializedRecordBatch []byte) error {
	if err := s.reserve(len(serializedRecordBatch)); err != nil {
		return err
	}
	return s.sender.SendArrowRecordBatch(serializedRecordBatch)
}

func (s *byteLimitSender) SendExecutionResult(result grpcdatasource.ExecutionResult) error {
	return s.sender.SendExecutionResult(result)
}

func (s *byteLimitSender) reserve(size int) error {
	if s.limit <= 0 {
		return nil
	}
	s.sent += int64(size)
	if s.sent > s.limit {
		return grpcdatasource.ResourceExhausted("datasource query byte limit exceeded")
	}
	return nil
}

var _ grpcdatasource.QueryExecutor = (*Executor)(nil)
var _ arrowipc.ChunkSender = (*byteLimitSender)(nil)
