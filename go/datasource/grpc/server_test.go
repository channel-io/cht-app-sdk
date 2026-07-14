package grpcdatasource_test

import (
	"context"
	"testing"

	datasourcearrow "github.com/channel-io/cht-app-sdk/go/datasource/arrow"
	grpcdatasource "github.com/channel-io/cht-app-sdk/go/datasource/grpc"
	datasourcev1 "github.com/channel-io/cht-app-sdk/go/internal/gen/io/channel/datasource/v1"
	"google.golang.org/grpc/metadata"
)

func TestServerExecutesQueryAndSendsChunks(t *testing.T) {
	server := grpcdatasource.NewServer(
		func(_ *datasourcev1.ExecuteQueryRequest, stream grpcdatasource.ExecuteQueryServer) error {
			chunk, err := grpcdatasource.ArrowRowsChunk(
				[]datasourcearrow.Column{{Name: "value", Type: "INT64"}},
				[]datasourcearrow.Row{{"value": int64(1)}},
			)
			if err != nil {
				return err
			}
			if err := stream.Send(chunk); err != nil {
				return err
			}
			return stream.Send(grpcdatasource.ResultChunk(1, false, 10))
		},
		grpcdatasource.WithAllowedSources("bigquery"),
	)

	stream := &captureStream{ctx: context.Background()}
	err := server.ExecuteQuery(&datasourcev1.ExecuteQueryRequest{
		Session:  &datasourcev1.SessionContext{ChannelId: "channel-1"},
		SourceId: "bigquery",
		Query:    "select 1",
	}, stream)
	if err != nil {
		t.Fatal(err)
	}
	if len(stream.chunks) != 2 || len(stream.chunks[0].GetArrow().GetDataBody()) == 0 || stream.chunks[1].GetResult().GetRowCount() != 1 {
		t.Fatalf("unexpected chunks: %+v", stream.chunks)
	}
}

func TestServerRejectsUnknownSource(t *testing.T) {
	server := grpcdatasource.NewServer(
		func(_ *datasourcev1.ExecuteQueryRequest, _ grpcdatasource.ExecuteQueryServer) error {
			t.Fatal("handler must not be called")
			return nil
		},
		grpcdatasource.WithAllowedSources("bigquery"),
	)

	stream := &captureStream{ctx: context.Background()}
	err := server.ExecuteQuery(&datasourcev1.ExecuteQueryRequest{
		Session:  &datasourcev1.SessionContext{ChannelId: "channel-1"},
		SourceId: "postgresql",
		Query:    "select 1",
	}, stream)
	if err == nil {
		t.Fatal("expected unknown source to fail")
	}
	if len(stream.chunks) != 1 || stream.chunks[0].GetError() == nil {
		t.Fatalf("expected terminal error chunk, got %+v", stream.chunks)
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
