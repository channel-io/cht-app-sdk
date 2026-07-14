package postgresql_test

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"errors"
	"io"
	"strconv"
	"sync/atomic"
	"testing"

	"github.com/channel-io/cht-app-sdk/go/datasource/postgresql"
	datasourcev1 "github.com/channel-io/cht-app-sdk/go/internal/gen/io/channel/datasource/v1"
	"google.golang.org/grpc/metadata"
)

var driverCounter atomic.Int64

func TestHandlerStreamsSQLRowsAsArrowAndResult(t *testing.T) {
	driverName := "datasource-postgresql-test-" + strconv.FormatInt(driverCounter.Add(1), 10)
	sql.Register(driverName, rowsDriver{})

	db, err := sql.Open(driverName, "")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	handler := postgresql.NewHandler(db)
	stream := &captureStream{ctx: context.Background()}
	err = handler(&datasourcev1.ExecuteQueryRequest{
		Session:  &datasourcev1.SessionContext{ChannelId: "channel-1"},
		SourceId: "postgresql",
		Query:    "select order_id, count from orders",
	}, stream)
	if err != nil {
		t.Fatal(err)
	}
	if len(stream.chunks) != 2 || stream.chunks[0].GetArrow() == nil || stream.chunks[1].GetResult().GetRowCount() != 1 {
		t.Fatalf("unexpected chunks: %+v", stream.chunks)
	}
}

type rowsDriver struct{}

func (rowsDriver) Open(string) (driver.Conn, error) {
	return rowsConn{}, nil
}

type rowsConn struct{}

func (rowsConn) Prepare(string) (driver.Stmt, error) {
	return nil, errors.New("not implemented")
}

func (rowsConn) Close() error {
	return nil
}

func (rowsConn) Begin() (driver.Tx, error) {
	return nil, errors.New("not implemented")
}

func (rowsConn) QueryContext(context.Context, string, []driver.NamedValue) (driver.Rows, error) {
	return &driverRows{
		columns: []string{"order_id", "count"},
		types:   []string{"TEXT", "INT8"},
		values: [][]driver.Value{
			{"o-1", int64(3)},
		},
	}, nil
}

type driverRows struct {
	columns []string
	types   []string
	values  [][]driver.Value
	index   int
}

func (r *driverRows) Columns() []string {
	return r.columns
}

func (r *driverRows) Close() error {
	return nil
}

func (r *driverRows) Next(dest []driver.Value) error {
	if r.index >= len(r.values) {
		return io.EOF
	}
	copy(dest, r.values[r.index])
	r.index++
	return nil
}

func (r *driverRows) ColumnTypeDatabaseTypeName(index int) string {
	if index < 0 || index >= len(r.types) {
		return ""
	}
	return r.types[index]
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
