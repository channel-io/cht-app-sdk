package postgresql

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	datasourcearrow "github.com/channel-io/cht-app-sdk/go/datasource/arrow"
	grpcdatasource "github.com/channel-io/cht-app-sdk/go/datasource/grpc"
	datasourcev1 "github.com/channel-io/cht-app-sdk/go/internal/gen/io/channel/datasource/v1"
)

const DefaultSourceID = "postgresql"

type Queryer interface {
	QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error)
}

type Option func(*handler)

type handler struct {
	db        Queryer
	sourceID  string
	batchSize int
}

func NewHandler(db Queryer, opts ...Option) grpcdatasource.ExecuteQueryHandler {
	h := &handler{
		db:        db,
		sourceID:  DefaultSourceID,
		batchSize: 1024,
	}
	for _, opt := range opts {
		if opt != nil {
			opt(h)
		}
	}
	return h.ExecuteQuery
}

func WithSourceID(sourceID string) Option {
	return func(h *handler) {
		if strings.TrimSpace(sourceID) != "" {
			h.sourceID = strings.TrimSpace(sourceID)
		}
	}
}

func WithBatchSize(batchSize int) Option {
	return func(h *handler) {
		if batchSize > 0 {
			h.batchSize = batchSize
		}
	}
}

func (h *handler) ExecuteQuery(req *datasourcev1.ExecuteQueryRequest, stream grpcdatasource.ExecuteQueryServer) error {
	if h.db == nil {
		return grpcdatasource.SendErrorAndReturn(stream, fmt.Errorf("postgresql datasource queryer is nil"))
	}
	start := time.Now()
	ctx := stream.Context()
	rows, err := h.db.QueryContext(ctx, req.GetQuery())
	if err != nil {
		_ = stream.Send(grpcdatasource.ErrorChunk(
			datasourcev1.DataSourceErrorCode_DATA_SOURCE_ERROR_CODE_EXTERNAL_ERROR,
			err.Error(),
			grpcdatasource.Upstream("postgresql", "", err.Error()),
		))
		return err
	}
	defer rows.Close()

	columns, err := columnsFromRows(rows)
	if err != nil {
		return grpcdatasource.SendErrorAndReturn(stream, err)
	}

	var count int64
	batch := make([]datasourcearrow.Row, 0, h.batchSize)
	for rows.Next() {
		row, err := scanRow(rows, columns)
		if err != nil {
			return grpcdatasource.SendErrorAndReturn(stream, err)
		}
		count++
		batch = append(batch, row)
		if len(batch) >= h.batchSize {
			if err := sendBatch(stream, columns, batch); err != nil {
				return err
			}
			batch = batch[:0]
		}
	}
	if err := rows.Err(); err != nil {
		return grpcdatasource.SendErrorAndReturn(stream, err)
	}
	if len(batch) > 0 {
		if err := sendBatch(stream, columns, batch); err != nil {
			return err
		}
	}
	return stream.Send(grpcdatasource.ResultChunk(count, false, time.Since(start).Milliseconds()))
}

func columnsFromRows(rows *sql.Rows) ([]datasourcearrow.Column, error) {
	names, err := rows.Columns()
	if err != nil {
		return nil, err
	}
	columnTypes, _ := rows.ColumnTypes()
	columns := make([]datasourcearrow.Column, 0, len(names))
	for index, name := range names {
		sourceType := "STRING"
		if index < len(columnTypes) && columnTypes[index] != nil && columnTypes[index].DatabaseTypeName() != "" {
			sourceType = columnTypes[index].DatabaseTypeName()
		}
		columns = append(columns, datasourcearrow.Column{Name: name, Type: sourceType})
	}
	return columns, nil
}

func scanRow(rows *sql.Rows, columns []datasourcearrow.Column) (datasourcearrow.Row, error) {
	values := make([]any, len(columns))
	targets := make([]any, len(columns))
	for i := range values {
		targets[i] = &values[i]
	}
	if err := rows.Scan(targets...); err != nil {
		return nil, err
	}
	row := make(datasourcearrow.Row, len(columns))
	for index, column := range columns {
		row[column.Name] = normalizeSQLValue(values[index])
	}
	return row, nil
}

func normalizeSQLValue(value any) any {
	switch v := value.(type) {
	case []byte:
		return string(v)
	default:
		return v
	}
}

func sendBatch(stream grpcdatasource.ExecuteQueryServer, columns []datasourcearrow.Column, batch []datasourcearrow.Row) error {
	chunk, err := grpcdatasource.ArrowRowsChunk(columns, batch)
	if err != nil {
		return grpcdatasource.SendErrorAndReturn(stream, err)
	}
	return stream.Send(chunk)
}
