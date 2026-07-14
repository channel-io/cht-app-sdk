package bigquery_test

import (
	"context"
	"testing"

	datasourcearrow "github.com/channel-io/cht-app-sdk/go/datasource/arrow"
	"github.com/channel-io/cht-app-sdk/go/datasource/bigquery"
	datasourcev1 "github.com/channel-io/cht-app-sdk/go/internal/gen/io/channel/datasource/v1"
	"google.golang.org/grpc/metadata"
)

func TestHandlerStreamsRowsAsArrowAndResult(t *testing.T) {
	handler := bigquery.NewHandler(
		bigquery.RowReaderFunc(func(_ context.Context, _ string, emit bigquery.RowEmitter) error {
			return emit(datasourcearrow.Row{"order_id": "o-1"})
		}),
		[]datasourcearrow.Column{{Name: "order_id", Type: "STRING"}},
	)

	stream := &captureStream{ctx: context.Background()}
	err := handler(&datasourcev1.ExecuteQueryRequest{
		Session:  &datasourcev1.SessionContext{ChannelId: "channel-1"},
		SourceId: "bigquery",
		Query:    "select order_id from orders",
	}, stream)
	if err != nil {
		t.Fatal(err)
	}
	if len(stream.chunks) != 2 || stream.chunks[0].GetArrow() == nil || stream.chunks[1].GetResult().GetRowCount() != 1 {
		t.Fatalf("unexpected chunks: %+v", stream.chunks)
	}
}

type captureStream struct {
	ctx    context.Context
	chunks []*datasourcev1.QueryChunk
}

func (c *captureStream) Send(chunk *datasourcev1.QueryChunk) error {
	c.chunks = append(c.chunks, chunk)
	return nil
}

func (c *captureStream) SetHeader(metadata.MD) error  { return nil }
func (c *captureStream) SendHeader(metadata.MD) error { return nil }
func (c *captureStream) SetTrailer(metadata.MD)       {}
func (c *captureStream) Context() context.Context     { return c.ctx }
func (c *captureStream) SendMsg(any) error            { return nil }
func (c *captureStream) RecvMsg(any) error            { return nil }
