package grpcdatasource

import (
	"context"
	"strings"

	datasourcearrow "github.com/channel-io/cht-app-sdk/go/datasource/arrow"
	datasourcev1 "github.com/channel-io/cht-app-sdk/go/internal/gen/io/channel/datasource/v1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

const ServiceName = "io.channel.datasource.v1.DataSourceService"

type (
	SessionContext       = datasourcev1.SessionContext
	ListTablesRequest    = datasourcev1.ListTablesRequest
	ListTablesResponse   = datasourcev1.ListTablesResponse
	DescribeTableRequest = datasourcev1.DescribeTableRequest
	TableDefinition      = datasourcev1.TableDefinition
	SearchTablesRequest  = datasourcev1.SearchTablesRequest
	SearchTablesResponse = datasourcev1.SearchTablesResponse
	ExecuteQueryRequest  = datasourcev1.ExecuteQueryRequest
	QueryChunk           = datasourcev1.QueryChunk
	ArrowIpcMessage      = datasourcev1.ArrowIpcMessage
	QueryResult          = datasourcev1.QueryResult
	DataSourceError      = datasourcev1.DataSourceError
	DataSourceErrorCode  = datasourcev1.DataSourceErrorCode
	ExecuteQueryServer   = grpc.ServerStreamingServer[datasourcev1.QueryChunk]
	UpstreamError        = datasourcev1.UpstreamError
)

type ExecuteQueryHandler func(req *datasourcev1.ExecuteQueryRequest, stream ExecuteQueryServer) error

type Option func(*Server)

type Server struct {
	datasourcev1.UnimplementedDataSourceServiceServer

	executeQuery  ExecuteQueryHandler
	allowedSource map[string]struct{}
}

func NewServer(handler ExecuteQueryHandler, opts ...Option) *Server {
	server := &Server{executeQuery: handler}
	for _, opt := range opts {
		if opt != nil {
			opt(server)
		}
	}
	return server
}

func Register(registrar grpc.ServiceRegistrar, server *Server) {
	datasourcev1.RegisterDataSourceServiceServer(registrar, server)
}

func WithAllowedSources(sourceIDs ...string) Option {
	return func(server *Server) {
		server.allowedSource = make(map[string]struct{}, len(sourceIDs))
		for _, sourceID := range sourceIDs {
			sourceID = strings.TrimSpace(sourceID)
			if sourceID == "" {
				continue
			}
			server.allowedSource[sourceID] = struct{}{}
		}
	}
}

func (s *Server) ExecuteQuery(req *datasourcev1.ExecuteQueryRequest, stream ExecuteQueryServer) error {
	if s == nil || s.executeQuery == nil {
		return SendErrorAndReturn(stream, status.Error(codes.Unimplemented, "ExecuteQuery handler is not configured"))
	}
	if err := validateExecuteQueryRequest(req, s.allowedSource); err != nil {
		return SendErrorAndReturn(stream, err)
	}
	return s.executeQuery(req, stream)
}

func validateExecuteQueryRequest(req *datasourcev1.ExecuteQueryRequest, allowedSources map[string]struct{}) error {
	if req == nil {
		return status.Error(codes.InvalidArgument, "request is required")
	}
	if req.GetSession() == nil {
		return status.Error(codes.InvalidArgument, "session is required")
	}
	sourceID := strings.TrimSpace(req.GetSourceId())
	if sourceID == "" {
		return status.Error(codes.InvalidArgument, "source_id is required")
	}
	if len(allowedSources) > 0 {
		if _, ok := allowedSources[sourceID]; !ok {
			return status.Error(codes.NotFound, "source_id is not registered")
		}
	}
	if strings.TrimSpace(req.GetQuery()) == "" {
		return status.Error(codes.InvalidArgument, "query is required")
	}
	return nil
}

func ArrowChunk(dataHeader []byte, dataBody []byte) *datasourcev1.QueryChunk {
	return &datasourcev1.QueryChunk{
		Payload: &datasourcev1.QueryChunk_Arrow{
			Arrow: &datasourcev1.ArrowIpcMessage{
				DataHeader: dataHeader,
				DataBody:   dataBody,
			},
		},
	}
}

func ArrowRowsChunk(columns []datasourcearrow.Column, rows []datasourcearrow.Row) (*datasourcev1.QueryChunk, error) {
	data, err := datasourcearrow.EncodeRows(columns, rows)
	if err != nil {
		return nil, err
	}
	return ArrowChunk(nil, data), nil
}

func ResultChunk(rowCount int64, limitExceeded bool, executionMS int64) *datasourcev1.QueryChunk {
	return &datasourcev1.QueryChunk{
		Payload: &datasourcev1.QueryChunk_Result{
			Result: &datasourcev1.QueryResult{
				RowCount:      rowCount,
				LimitExceeded: limitExceeded,
				ExecutionMs:   executionMS,
			},
		},
	}
}

type ErrorOption func(*datasourcev1.DataSourceError)

func Retryable(retryable bool) ErrorOption {
	return func(err *datasourcev1.DataSourceError) {
		err.Retryable = retryable
	}
}

func Upstream(engine string, code string, message string) ErrorOption {
	return func(err *datasourcev1.DataSourceError) {
		err.Upstream = &datasourcev1.UpstreamError{
			Engine:  engine,
			Code:    code,
			Message: message,
		}
	}
}

func ErrorChunk(code datasourcev1.DataSourceErrorCode, message string, opts ...ErrorOption) *datasourcev1.QueryChunk {
	dataSourceError := &datasourcev1.DataSourceError{
		Code:    code,
		Message: message,
	}
	for _, opt := range opts {
		if opt != nil {
			opt(dataSourceError)
		}
	}
	return &datasourcev1.QueryChunk{
		Payload: &datasourcev1.QueryChunk_Error{
			Error: dataSourceError,
		},
	}
}

func SendErrorAndReturn(stream ExecuteQueryServer, err error) error {
	if err == nil {
		return nil
	}
	chunk := ErrorChunk(ErrorCodeFromGRPC(err), statusMessage(err), Retryable(isRetryableGRPCError(err)))
	if stream != nil {
		_ = stream.Send(chunk)
	}
	return err
}

func ErrorCodeFromGRPC(err error) datasourcev1.DataSourceErrorCode {
	switch status.Code(err) {
	case codes.Unauthenticated:
		return datasourcev1.DataSourceErrorCode_DATA_SOURCE_ERROR_CODE_UNAUTHENTICATED
	case codes.PermissionDenied:
		return datasourcev1.DataSourceErrorCode_DATA_SOURCE_ERROR_CODE_PERMISSION_DENIED
	case codes.NotFound:
		return datasourcev1.DataSourceErrorCode_DATA_SOURCE_ERROR_CODE_SOURCE_NOT_FOUND
	case codes.InvalidArgument:
		return datasourcev1.DataSourceErrorCode_DATA_SOURCE_ERROR_CODE_INVALID_ARGUMENT
	case codes.DeadlineExceeded:
		return datasourcev1.DataSourceErrorCode_DATA_SOURCE_ERROR_CODE_TIMEOUT
	case codes.ResourceExhausted:
		return datasourcev1.DataSourceErrorCode_DATA_SOURCE_ERROR_CODE_RESOURCE_EXHAUSTED
	case codes.Unavailable:
		return datasourcev1.DataSourceErrorCode_DATA_SOURCE_ERROR_CODE_UNAVAILABLE
	case codes.Canceled:
		return datasourcev1.DataSourceErrorCode_DATA_SOURCE_ERROR_CODE_CANCELLED
	default:
		return datasourcev1.DataSourceErrorCode_DATA_SOURCE_ERROR_CODE_INTERNAL
	}
}

func statusMessage(err error) string {
	if st, ok := status.FromError(err); ok {
		return st.Message()
	}
	return err.Error()
}

func isRetryableGRPCError(err error) bool {
	switch status.Code(err) {
	case codes.Unavailable, codes.DeadlineExceeded, codes.ResourceExhausted, codes.Aborted:
		return true
	default:
		return false
	}
}

func Context(stream ExecuteQueryServer) context.Context {
	if stream == nil {
		return context.Background()
	}
	return stream.Context()
}
