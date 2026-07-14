package datasourcearrow_test

import (
	"bytes"
	"testing"

	"github.com/apache/arrow-go/v18/arrow"
	"github.com/apache/arrow-go/v18/arrow/array"
	"github.com/apache/arrow-go/v18/arrow/ipc"

	datasourcearrow "github.com/channel-io/cht-app-sdk/go/datasource/arrow"
)

func TestEncodeRowsReturnsArrowIPCBytes(t *testing.T) {
	data, err := datasourcearrow.EncodeRows(
		[]datasourcearrow.Column{
			{Name: "channel_id", Type: "STRING"},
			{Name: "count", Type: "INT64"},
		},
		[]datasourcearrow.Row{{"channel_id": "channel-1", "count": int64(3)}},
	)
	if err != nil {
		t.Fatal(err)
	}
	if len(data) == 0 {
		t.Fatal("expected Arrow IPC payload")
	}
}

func TestEncodeRowsMapsDecimalHugeintAndInt256Types(t *testing.T) {
	data, err := datasourcearrow.EncodeRows(
		[]datasourcearrow.Column{
			{Name: "amount", Type: "DECIMAL(20,6)"},
			{Name: "wide_amount", Type: "NUMERIC(40,6)"},
			{Name: "sum_amount", Type: "HUGEINT"},
			{Name: "big_counter", Type: "INT256"},
		},
		[]datasourcearrow.Row{{
			"amount":      "123.456789",
			"wide_amount": "1234567890123456789012345678901234.123456",
			"sum_amount":  "170141183460469231731687303715884105727",
			"big_counter": "12345678901234567890123456789012345678901234567890",
		}},
	)
	if err != nil {
		t.Fatal(err)
	}

	reader, err := ipc.NewReader(bytes.NewReader(data))
	if err != nil {
		t.Fatalf("new ipc reader: %v", err)
	}
	defer reader.Release()

	record, err := reader.Read()
	if err != nil {
		t.Fatalf("read record: %v", err)
	}
	defer record.Release()

	amountType := record.Schema().Field(0).Type.(*arrow.Decimal128Type)
	if amountType.Precision != 20 || amountType.Scale != 6 {
		t.Fatalf("amount type mismatch: %v", amountType)
	}
	wideAmountType := record.Schema().Field(1).Type.(*arrow.Decimal256Type)
	if wideAmountType.Precision != 40 || wideAmountType.Scale != 6 {
		t.Fatalf("wide amount type mismatch: %v", wideAmountType)
	}
	sumAmountType := record.Schema().Field(2).Type.(*arrow.Decimal256Type)
	if sumAmountType.Precision != 39 || sumAmountType.Scale != 0 {
		t.Fatalf("sum amount type mismatch: %v", sumAmountType)
	}
	bigCounterType := record.Schema().Field(3).Type.(*arrow.Decimal256Type)
	if bigCounterType.Precision != 76 || bigCounterType.Scale != 0 {
		t.Fatalf("big counter type mismatch: %v", bigCounterType)
	}

	amount := record.Column(0).(*array.Decimal128)
	if got := amount.Value(0).ToString(amountType.Scale); got != "123.456789" {
		t.Fatalf("amount value mismatch: %s", got)
	}
	wideAmount := record.Column(1).(*array.Decimal256)
	if got := wideAmount.Value(0).ToString(wideAmountType.Scale); got != "1234567890123456789012345678901234.123456" {
		t.Fatalf("wide amount value mismatch: %s", got)
	}
	sumAmount := record.Column(2).(*array.Decimal256)
	if got := sumAmount.Value(0).ToString(sumAmountType.Scale); got != "170141183460469231731687303715884105727" {
		t.Fatalf("sum amount value mismatch: %s", got)
	}
	bigCounter := record.Column(3).(*array.Decimal256)
	if got := bigCounter.Value(0).ToString(bigCounterType.Scale); got != "12345678901234567890123456789012345678901234567890" {
		t.Fatalf("big counter value mismatch: %s", got)
	}
}
