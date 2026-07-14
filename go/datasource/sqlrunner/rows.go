package sqlrunner

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/apache/arrow-go/v18/arrow"
	"github.com/apache/arrow-go/v18/arrow/array"
	"github.com/apache/arrow-go/v18/arrow/decimal128"
	"github.com/apache/arrow-go/v18/arrow/decimal256"
	"github.com/apache/arrow-go/v18/arrow/memory"

	"github.com/channel-io/cht-app-sdk/go/datasource/arrowipc"
)

type StreamRowsOptions struct {
	BatchSize int
}

type decimalSpec struct {
	precision int32
	scale     int32
}

const (
	defaultDecimalPrecision int32 = 38
	defaultDecimalScale     int32 = 0
	hugeIntPrecision        int32 = 39
	int256Precision         int32 = 76
	maxDecimalPrecision     int32 = 76
)

func StreamRows(ctx context.Context, rows *sql.Rows, sender arrowipc.ChunkSender, opts StreamRowsOptions) (int64, error) {
	if rows == nil {
		return 0, fmt.Errorf("rows is required")
	}
	if sender == nil {
		return 0, fmt.Errorf("arrow chunk sender is required")
	}
	batchSize := opts.BatchSize
	if batchSize <= 0 {
		batchSize = DefaultBatchSize
	}

	columnTypes, err := rows.ColumnTypes()
	if err != nil {
		return 0, err
	}
	schema := schemaFromColumnTypes(columnTypes)
	writer := arrowipc.NewWriter(sender, schema)
	writerClosed := false
	defer func() {
		if !writerClosed {
			_ = writer.Close()
		}
	}()

	builder := array.NewRecordBuilder(memory.DefaultAllocator, schema)
	defer builder.Release()
	builder.Reserve(batchSize)

	values := make([]any, len(columnTypes))
	scanDest := make([]any, len(columnTypes))
	for i := range values {
		scanDest[i] = &values[i]
	}

	var rowCount int64
	rowsInBatch := 0
	for rows.Next() {
		if err := ctx.Err(); err != nil {
			return rowCount, err
		}
		if err := rows.Scan(scanDest...); err != nil {
			return rowCount, err
		}
		for i, value := range values {
			if err := appendArrowValue(builder.Field(i), value); err != nil {
				return rowCount, fmt.Errorf("append column %s: %w", columnTypes[i].Name(), err)
			}
			values[i] = nil
		}
		rowCount++
		rowsInBatch++
		if rowsInBatch >= batchSize {
			if err := flushRecordBatch(writer, builder); err != nil {
				return rowCount, err
			}
			rowsInBatch = 0
		}
	}
	if rowsInBatch > 0 {
		if err := flushRecordBatch(writer, builder); err != nil {
			return rowCount, err
		}
	}
	writerClosed = true
	return rowCount, writer.Close()
}

func flushRecordBatch(writer interface{ Write(arrow.RecordBatch) error }, builder *array.RecordBuilder) error {
	record := builder.NewRecordBatch()
	defer record.Release()
	return writer.Write(record)
}

func schemaFromColumnTypes(columnTypes []*sql.ColumnType) *arrow.Schema {
	fields := make([]arrow.Field, len(columnTypes))
	for i, columnType := range columnTypes {
		nullable, ok := columnType.Nullable()
		if !ok {
			nullable = true
		}
		fields[i] = arrow.Field{
			Name:     columnType.Name(),
			Type:     arrowTypeFromColumnType(columnType),
			Nullable: nullable,
		}
	}
	return arrow.NewSchema(fields, nil)
}

func arrowTypeFromColumnType(columnType *sql.ColumnType) arrow.DataType {
	if spec, ok := decimalSpecFromDatabaseType(columnType.DatabaseTypeName()); ok {
		if precision, scale, ok := columnType.DecimalSize(); ok {
			spec = decimalSpec{precision: int32(precision), scale: int32(scale)}
		}
		normalized, ok := normalizeDecimalSpec(spec)
		if !ok {
			return arrow.BinaryTypes.String
		}
		return decimalArrowType(normalized)
	}
	return arrowTypeFromDatabaseType(columnType.DatabaseTypeName())
}

func arrowTypeFromDatabaseType(databaseType string) arrow.DataType {
	if spec, ok := decimalSpecFromDatabaseType(databaseType); ok {
		return decimalArrowType(spec)
	}

	switch baseDatabaseTypeName(databaseType) {
	case "INT2", "INT4", "INT8", "INTEGER", "BIGINT", "SMALLINT", "SERIAL", "BIGSERIAL":
		return arrow.PrimitiveTypes.Int64
	case "FLOAT4", "FLOAT8", "REAL", "DOUBLE", "DOUBLE PRECISION":
		return arrow.PrimitiveTypes.Float64
	case "BOOL", "BOOLEAN":
		return arrow.FixedWidthTypes.Boolean
	case "DATE":
		return arrow.PrimitiveTypes.Date32
	case "TIMESTAMP", "TIMESTAMPTZ", "TIMESTAMPZ", "DATETIME":
		return &arrow.TimestampType{Unit: arrow.Microsecond, TimeZone: "UTC"}
	case "BYTEA", "BINARY", "VARBINARY":
		return arrow.BinaryTypes.Binary
	default:
		return arrow.BinaryTypes.String
	}
}

func appendArrowValue(builder array.Builder, value any) error {
	if value == nil {
		builder.AppendNull()
		return nil
	}

	switch b := builder.(type) {
	case *array.StringBuilder:
		b.Append(stringValue(value))
	case *array.BinaryBuilder:
		b.Append(byteValue(value))
	case *array.BooleanBuilder:
		v, err := boolValue(value)
		if err != nil {
			return err
		}
		b.Append(v)
	case *array.Int64Builder:
		v, err := int64Value(value)
		if err != nil {
			return err
		}
		b.Append(v)
	case *array.Float64Builder:
		v, err := float64Value(value)
		if err != nil {
			return err
		}
		b.Append(v)
	case *array.Decimal128Builder:
		v, err := decimal128Value(value, b.Type().(*arrow.Decimal128Type))
		if err != nil {
			return err
		}
		b.Append(v)
	case *array.Decimal256Builder:
		v, err := decimal256Value(value, b.Type().(*arrow.Decimal256Type))
		if err != nil {
			return err
		}
		b.Append(v)
	case *array.Date32Builder:
		t, err := timeValue(value)
		if err != nil {
			return err
		}
		b.Append(arrow.Date32FromTime(t))
	case *array.TimestampBuilder:
		t, err := timeValue(value)
		if err != nil {
			return err
		}
		b.AppendTime(t)
	default:
		return builder.AppendValueFromString(stringValue(value))
	}
	return nil
}

func decimalSpecFromDatabaseType(databaseType string) (decimalSpec, bool) {
	base, precision, scale, hasPrecision := splitDecimalTypeName(databaseType)
	switch base {
	case "DECIMAL", "DEC", "NUMERIC":
		if hasPrecision {
			return normalizeDecimalSpec(decimalSpec{precision: precision, scale: scale})
		}
		return decimalSpec{precision: defaultDecimalPrecision, scale: defaultDecimalScale}, true
	case "BIGNUMERIC", "BIGDECIMAL":
		if hasPrecision {
			return normalizeDecimalSpec(decimalSpec{precision: precision, scale: scale})
		}
		return decimalSpec{precision: maxDecimalPrecision, scale: 38}, true
	case "HUGEINT", "INT128", "UHUGEINT", "UINT128":
		return decimalSpec{precision: hugeIntPrecision, scale: 0}, true
	case "INT256", "UINT256":
		if hasPrecision {
			return normalizeDecimalSpec(decimalSpec{precision: precision, scale: scale})
		}
		return decimalSpec{precision: int256Precision, scale: 0}, true
	default:
		return decimalSpec{}, false
	}
}

func splitDecimalTypeName(databaseType string) (string, int32, int32, bool) {
	normalized := strings.ToUpper(strings.TrimSpace(databaseType))
	open := strings.Index(normalized, "(")
	if open < 0 {
		return normalized, 0, 0, false
	}

	base := strings.TrimSpace(normalized[:open])
	close := strings.LastIndex(normalized, ")")
	if close < open {
		return base, 0, 0, false
	}

	parts := strings.Split(normalized[open+1:close], ",")
	precision, err := strconv.ParseInt(strings.TrimSpace(parts[0]), 10, 32)
	if err != nil {
		return base, 0, 0, false
	}
	var scale int64
	if len(parts) > 1 {
		scale, err = strconv.ParseInt(strings.TrimSpace(parts[1]), 10, 32)
		if err != nil {
			return base, 0, 0, false
		}
	}
	return base, int32(precision), int32(scale), true
}

func baseDatabaseTypeName(databaseType string) string {
	normalized := strings.ToUpper(strings.TrimSpace(databaseType))
	if open := strings.Index(normalized, "("); open >= 0 {
		return strings.TrimSpace(normalized[:open])
	}
	return normalized
}

func normalizeDecimalSpec(spec decimalSpec) (decimalSpec, bool) {
	if spec.precision <= 0 || spec.precision > maxDecimalPrecision || spec.scale < 0 {
		return decimalSpec{}, false
	}
	return spec, true
}

func decimalArrowType(spec decimalSpec) arrow.DataType {
	if spec.precision <= defaultDecimalPrecision {
		return &arrow.Decimal128Type{Precision: spec.precision, Scale: spec.scale}
	}
	return &arrow.Decimal256Type{Precision: spec.precision, Scale: spec.scale}
}

func stringValue(value any) string {
	switch v := value.(type) {
	case string:
		return v
	case []byte:
		return string(v)
	case sql.RawBytes:
		return string(v)
	case fmt.Stringer:
		return v.String()
	default:
		return fmt.Sprint(v)
	}
}

func byteValue(value any) []byte {
	switch v := value.(type) {
	case []byte:
		return append([]byte(nil), v...)
	case sql.RawBytes:
		return append([]byte(nil), v...)
	case string:
		return []byte(v)
	default:
		return []byte(fmt.Sprint(v))
	}
}

func boolValue(value any) (bool, error) {
	switch v := value.(type) {
	case bool:
		return v, nil
	case string:
		return strconv.ParseBool(v)
	case []byte:
		return strconv.ParseBool(string(v))
	default:
		return false, fmt.Errorf("cannot convert %T to bool", value)
	}
}

func int64Value(value any) (int64, error) {
	switch v := value.(type) {
	case int:
		return int64(v), nil
	case int8:
		return int64(v), nil
	case int16:
		return int64(v), nil
	case int32:
		return int64(v), nil
	case int64:
		return v, nil
	case uint:
		return int64(v), nil
	case uint8:
		return int64(v), nil
	case uint16:
		return int64(v), nil
	case uint32:
		return int64(v), nil
	case uint64:
		return int64(v), nil
	case string:
		return strconv.ParseInt(v, 10, 64)
	case []byte:
		return strconv.ParseInt(string(v), 10, 64)
	default:
		return 0, fmt.Errorf("cannot convert %T to int64", value)
	}
}

func float64Value(value any) (float64, error) {
	switch v := value.(type) {
	case float32:
		return float64(v), nil
	case float64:
		return v, nil
	case string:
		return strconv.ParseFloat(v, 64)
	case []byte:
		return strconv.ParseFloat(string(v), 64)
	default:
		return 0, fmt.Errorf("cannot convert %T to float64", value)
	}
}

func decimal128Value(value any, dataType *arrow.Decimal128Type) (decimal128.Num, error) {
	switch v := value.(type) {
	case decimal128.Num:
		return v, nil
	case float32:
		return decimal128.FromFloat64(float64(v), dataType.Precision, dataType.Scale)
	case float64:
		return decimal128.FromFloat64(v, dataType.Precision, dataType.Scale)
	default:
		return decimal128.FromString(stringValue(value), dataType.Precision, dataType.Scale)
	}
}

func decimal256Value(value any, dataType *arrow.Decimal256Type) (decimal256.Num, error) {
	switch v := value.(type) {
	case decimal256.Num:
		return v, nil
	case float32:
		return decimal256.FromFloat64(float64(v), dataType.Precision, dataType.Scale)
	case float64:
		return decimal256.FromFloat64(v, dataType.Precision, dataType.Scale)
	default:
		return decimal256.FromString(stringValue(value), dataType.Precision, dataType.Scale)
	}
}

func timeValue(value any) (time.Time, error) {
	switch v := value.(type) {
	case time.Time:
		return v, nil
	case string:
		return parseTime(v)
	case []byte:
		return parseTime(string(v))
	default:
		return time.Time{}, fmt.Errorf("cannot convert %T to time", value)
	}
}

func parseTime(value string) (time.Time, error) {
	for _, layout := range []string{
		time.RFC3339Nano,
		"2006-01-02 15:04:05.999999999-07",
		"2006-01-02 15:04:05.999999999",
		"2006-01-02 15:04:05",
		"2006-01-02",
	} {
		if parsed, err := time.Parse(layout, value); err == nil {
			return parsed, nil
		}
	}
	return time.Time{}, fmt.Errorf("cannot parse time %q", value)
}
