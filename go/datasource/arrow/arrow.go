package datasourcearrow

import (
	"bytes"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/apache/arrow-go/v18/arrow"
	"github.com/apache/arrow-go/v18/arrow/array"
	"github.com/apache/arrow-go/v18/arrow/decimal128"
	"github.com/apache/arrow-go/v18/arrow/decimal256"
	"github.com/apache/arrow-go/v18/arrow/ipc"
	"github.com/apache/arrow-go/v18/arrow/memory"
)

type Column struct {
	Name      string
	Type      string
	Precision int32
	Scale     int32
}

type Row map[string]any

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

func EncodeRows(columns []Column, rows []Row) ([]byte, error) {
	if len(columns) == 0 {
		return nil, fmt.Errorf("columns are required")
	}

	fields := make([]arrow.Field, 0, len(columns))
	for _, column := range columns {
		fields = append(fields, arrow.Field{Name: column.Name, Type: arrowType(column), Nullable: true})
	}
	schema := arrow.NewSchema(fields, nil)
	builder := array.NewRecordBuilder(memory.DefaultAllocator, schema)
	defer builder.Release()

	for _, row := range rows {
		for index, column := range columns {
			appendValue(builder.Field(index), row[column.Name])
		}
	}

	record := builder.NewRecord()
	defer record.Release()

	var buffer bytes.Buffer
	writer := ipc.NewWriter(&buffer, ipc.WithSchema(schema))
	if err := writer.Write(record); err != nil {
		_ = writer.Close()
		return nil, err
	}
	if err := writer.Close(); err != nil {
		return nil, err
	}
	return buffer.Bytes(), nil
}

func arrowType(column Column) arrow.DataType {
	if spec, ok := decimalSpecFromColumn(column); ok {
		return decimalArrowType(spec)
	}

	normalized := strings.ToLower(column.Type)
	switch {
	case strings.Contains(normalized, "bool"):
		return arrow.FixedWidthTypes.Boolean
	case strings.Contains(normalized, "int"), strings.Contains(normalized, "serial"):
		return arrow.PrimitiveTypes.Int64
	case strings.Contains(normalized, "float"), strings.Contains(normalized, "double"):
		return arrow.PrimitiveTypes.Float64
	case strings.Contains(normalized, "time"), strings.Contains(normalized, "date"):
		return arrow.FixedWidthTypes.Timestamp_us
	default:
		return arrow.BinaryTypes.String
	}
}

func appendValue(builder array.Builder, value any) {
	if value == nil {
		builder.AppendNull()
		return
	}

	switch b := builder.(type) {
	case *array.BooleanBuilder:
		v, ok := toBool(value)
		if !ok {
			b.AppendNull()
			return
		}
		b.Append(v)
	case *array.Int64Builder:
		v, ok := toInt64(value)
		if !ok {
			b.AppendNull()
			return
		}
		b.Append(v)
	case *array.Float64Builder:
		v, ok := toFloat64(value)
		if !ok {
			b.AppendNull()
			return
		}
		b.Append(v)
	case *array.Decimal128Builder:
		v, ok := toDecimal128(value, b.Type().(*arrow.Decimal128Type))
		if !ok {
			b.AppendNull()
			return
		}
		b.Append(v)
	case *array.Decimal256Builder:
		v, ok := toDecimal256(value, b.Type().(*arrow.Decimal256Type))
		if !ok {
			b.AppendNull()
			return
		}
		b.Append(v)
	case *array.TimestampBuilder:
		v, ok := toTimestamp(value)
		if !ok {
			b.AppendNull()
			return
		}
		b.Append(v)
	case *array.StringBuilder:
		b.Append(toString(value))
	default:
		builder.AppendNull()
	}
}

func decimalSpecFromColumn(column Column) (decimalSpec, bool) {
	spec, ok := decimalSpecFromTypeName(column.Type)
	if column.Precision > 0 {
		spec = decimalSpec{precision: column.Precision, scale: column.Scale}
		ok = true
	}
	if !ok {
		return decimalSpec{}, false
	}
	return normalizeDecimalSpec(spec)
}

func decimalSpecFromTypeName(sourceType string) (decimalSpec, bool) {
	base, precision, scale, hasPrecision := splitDecimalTypeName(sourceType)
	switch base {
	case "DECIMAL", "DEC", "NUMERIC":
		if hasPrecision {
			return decimalSpec{precision: precision, scale: scale}, true
		}
		return decimalSpec{precision: defaultDecimalPrecision, scale: defaultDecimalScale}, true
	case "BIGNUMERIC", "BIGDECIMAL":
		if hasPrecision {
			return decimalSpec{precision: precision, scale: scale}, true
		}
		return decimalSpec{precision: maxDecimalPrecision, scale: 38}, true
	case "HUGEINT", "INT128", "UHUGEINT", "UINT128":
		return decimalSpec{precision: hugeIntPrecision, scale: 0}, true
	case "INT256", "UINT256":
		if hasPrecision {
			return decimalSpec{precision: precision, scale: scale}, true
		}
		return decimalSpec{precision: int256Precision, scale: 0}, true
	default:
		return decimalSpec{}, false
	}
}

func splitDecimalTypeName(sourceType string) (string, int32, int32, bool) {
	normalized := strings.ToUpper(strings.TrimSpace(sourceType))
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

func toBool(value any) (bool, bool) {
	switch v := value.(type) {
	case bool:
		return v, true
	case string:
		parsed, err := strconv.ParseBool(v)
		return parsed, err == nil
	case []byte:
		parsed, err := strconv.ParseBool(string(v))
		return parsed, err == nil
	default:
		return false, false
	}
}

func toInt64(value any) (int64, bool) {
	switch v := value.(type) {
	case int:
		return int64(v), true
	case int8:
		return int64(v), true
	case int16:
		return int64(v), true
	case int32:
		return int64(v), true
	case int64:
		return v, true
	case uint:
		return int64(v), true
	case uint8:
		return int64(v), true
	case uint16:
		return int64(v), true
	case uint32:
		return int64(v), true
	case uint64:
		if v > uint64(^uint64(0)>>1) {
			return 0, false
		}
		return int64(v), true
	case float32:
		return int64(v), true
	case float64:
		return int64(v), true
	case string:
		parsed, err := strconv.ParseInt(v, 10, 64)
		return parsed, err == nil
	case []byte:
		parsed, err := strconv.ParseInt(string(v), 10, 64)
		return parsed, err == nil
	default:
		return 0, false
	}
}

func toFloat64(value any) (float64, bool) {
	switch v := value.(type) {
	case float32:
		return float64(v), true
	case float64:
		return v, true
	case int:
		return float64(v), true
	case int64:
		return float64(v), true
	case string:
		parsed, err := strconv.ParseFloat(v, 64)
		return parsed, err == nil
	case []byte:
		parsed, err := strconv.ParseFloat(string(v), 64)
		return parsed, err == nil
	default:
		return 0, false
	}
}

func toDecimal128(value any, dataType *arrow.Decimal128Type) (decimal128.Num, bool) {
	switch v := value.(type) {
	case decimal128.Num:
		return v, true
	case float32:
		parsed, err := decimal128.FromFloat64(float64(v), dataType.Precision, dataType.Scale)
		return parsed, err == nil
	case float64:
		parsed, err := decimal128.FromFloat64(v, dataType.Precision, dataType.Scale)
		return parsed, err == nil
	default:
		parsed, err := decimal128.FromString(toString(value), dataType.Precision, dataType.Scale)
		return parsed, err == nil
	}
}

func toDecimal256(value any, dataType *arrow.Decimal256Type) (decimal256.Num, bool) {
	switch v := value.(type) {
	case decimal256.Num:
		return v, true
	case float32:
		parsed, err := decimal256.FromFloat64(float64(v), dataType.Precision, dataType.Scale)
		return parsed, err == nil
	case float64:
		parsed, err := decimal256.FromFloat64(v, dataType.Precision, dataType.Scale)
		return parsed, err == nil
	default:
		parsed, err := decimal256.FromString(toString(value), dataType.Precision, dataType.Scale)
		return parsed, err == nil
	}
}

func toTimestamp(value any) (arrow.Timestamp, bool) {
	switch v := value.(type) {
	case time.Time:
		return arrow.Timestamp(v.UnixMicro()), true
	case string:
		parsed, err := time.Parse(time.RFC3339Nano, v)
		if err != nil {
			return 0, false
		}
		return arrow.Timestamp(parsed.UnixMicro()), true
	case []byte:
		return toTimestamp(string(v))
	default:
		return 0, false
	}
}

func toString(value any) string {
	switch v := value.(type) {
	case string:
		return v
	case []byte:
		return string(v)
	case fmt.Stringer:
		return v.String()
	default:
		return fmt.Sprint(v)
	}
}
