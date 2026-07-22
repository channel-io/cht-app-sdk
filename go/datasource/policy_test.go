package datasource_test

import (
	"testing"

	"github.com/channel-io/app-sdk/go/datasource"
)

func TestValidateReadOnlyQueryRejectsWrites(t *testing.T) {
	err := datasource.ValidateReadOnlyQuery("UPDATE orders SET id = 'x'", nil, nil)
	if err == nil {
		t.Fatal("expected writable query to fail")
	}
}

func TestValidateReadOnlyQueryAcceptsMultilineSelectAndWith(t *testing.T) {
	for _, query := range []string{
		"SELECT\n  COUNT(*) AS order_count\nFROM orders",
		"WITH\n  recent_orders AS (SELECT id FROM orders)\nSELECT COUNT(*) FROM recent_orders",
	} {
		err := datasource.ValidateReadOnlyQuery(query, []string{"orders"}, []datasource.TableConfig{{Name: "orders"}})
		if err != nil {
			t.Fatalf("expected multiline read-only query to pass: %v", err)
		}
	}
}

func TestValidateReadOnlyQueryChecksSupportedTables(t *testing.T) {
	err := datasource.ValidateReadOnlyQuery(
		"SELECT id FROM orders",
		nil,
		[]datasource.TableConfig{{Name: "orders"}},
	)
	if err != nil {
		t.Fatalf("expected supported query: %v", err)
	}

	err = datasource.ValidateReadOnlyQuery(
		"SELECT id FROM customers",
		nil,
		[]datasource.TableConfig{{Name: "orders"}},
	)
	if err == nil {
		t.Fatal("expected unsupported table query to fail")
	}
}

func TestQueryWithRowLimitWrapsQuery(t *testing.T) {
	got := datasource.QueryWithRowLimit("SELECT id FROM orders;", 10)
	want := "SELECT * FROM (SELECT id FROM orders) AS datasource_query LIMIT 10"
	if got != want {
		t.Fatalf("unexpected query:\nwant: %s\n got: %s", want, got)
	}
}
