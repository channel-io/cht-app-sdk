package bigquery

import (
	"context"
	"fmt"
	"strings"
	"time"

	datasourcearrow "github.com/channel-io/app-sdk/go/datasource/arrow"
	grpcdatasource "github.com/channel-io/app-sdk/go/datasource/grpc"
	datasourcev1 "github.com/channel-io/app-sdk/go/internal/gen/io/channel/datasource/v1"
)

const DefaultSourceID = "bigquery"

type RowReader interface {
	ReadRows(ctx context.Context, query string, emit RowEmitter) error
}

type RowEmitter func(datasourcearrow.Row) error

type RowReaderFunc func(ctx context.Context, query string, emit RowEmitter) error

func (f RowReaderFunc) ReadRows(ctx context.Context, query string, emit RowEmitter) error {
	return f(ctx, query, emit)
}

type Option func(*handler)

type handler struct {
	reader    RowReader
	sourceID  string
	columns   []datasourcearrow.Column
	batchSize int
}

func NewHandler(reader RowReader, columns []datasourcearrow.Column, opts ...Option) grpcdatasource.ExecuteQueryHandler {
	h := &handler{
		reader:    reader,
		sourceID:  DefaultSourceID,
		columns:   append([]datasourcearrow.Column(nil), columns...),
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
	if h.reader == nil {
		return grpcdatasource.SendErrorAndReturn(stream, fmt.Errorf("bigquery datasource row reader is nil"))
	}
	if len(h.columns) == 0 {
		return grpcdatasource.SendErrorAndReturn(stream, fmt.Errorf("bigquery datasource columns are required"))
	}
	start := time.Now()
	var count int64
	batch := make([]datasourcearrow.Row, 0, h.batchSize)
	err := h.reader.ReadRows(stream.Context(), req.GetQuery(), func(row datasourcearrow.Row) error {
		count++
		batch = append(batch, row)
		if len(batch) < h.batchSize {
			return nil
		}
		if err := sendBatch(stream, h.columns, batch); err != nil {
			return err
		}
		batch = batch[:0]
		return nil
	})
	if err != nil {
		_ = stream.Send(grpcdatasource.ErrorChunk(
			datasourcev1.DataSourceErrorCode_DATA_SOURCE_ERROR_CODE_EXTERNAL_ERROR,
			err.Error(),
			grpcdatasource.Upstream("bigquery", "", err.Error()),
		))
		return err
	}
	if len(batch) > 0 {
		if err := sendBatch(stream, h.columns, batch); err != nil {
			return err
		}
	}
	return stream.Send(grpcdatasource.ResultChunk(count, false, time.Since(start).Milliseconds()))
}

func sendBatch(stream grpcdatasource.ExecuteQueryServer, columns []datasourcearrow.Column, batch []datasourcearrow.Row) error {
	chunk, err := grpcdatasource.ArrowRowsChunk(columns, batch)
	if err != nil {
		return grpcdatasource.SendErrorAndReturn(stream, err)
	}
	return stream.Send(chunk)
}
