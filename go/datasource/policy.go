package datasource

import (
	"fmt"
	"regexp"
	"strings"
)

var readOnlyStatementStartPattern = regexp.MustCompile(`(?i)^(select|with)\s`)

type TableConfig struct {
	Name         string
	TenantColumn string
}

func IsSingleReadOnlyStatement(query string) bool {
	normalized := strings.TrimSpace(query)
	normalized = strings.TrimSuffix(normalized, ";")
	if normalized == "" || strings.Contains(normalized, ";") {
		return false
	}
	if !readOnlyStatementStartPattern.MatchString(normalized) {
		return false
	}
	lower := strings.ToLower(normalized)
	for _, keyword := range []string{
		"alter", "analyze", "begin", "call", "commit", "copy", "create", "delete",
		"drop", "export", "grant", "import", "insert", "load", "merge", "revoke",
		"rollback", "set", "truncate", "update", "vacuum",
	} {
		if ContainsIdentifier(lower, keyword) {
			return false
		}
	}
	return true
}

func ContainsIdentifier(query string, identifier string) bool {
	pattern := regexp.MustCompile(`(?i)(^|[^A-Za-z0-9_])` + regexp.QuoteMeta(identifier) + `([^A-Za-z0-9_]|$)`)
	return pattern.MatchString(query)
}

func ReferencedTables(query string, explicitTableNames []string, tables []TableConfig) []string {
	if len(explicitTableNames) > 0 {
		return append([]string(nil), explicitTableNames...)
	}
	result := []string{}
	for _, table := range tables {
		if table.Name != "" && ContainsIdentifier(query, table.Name) {
			result = append(result, table.Name)
		}
	}
	return result
}

func ValidateReadOnlyQuery(query string, explicitTableNames []string, tables []TableConfig) error {
	if strings.TrimSpace(query) == "" {
		return fmt.Errorf("query is required")
	}
	if !IsSingleReadOnlyStatement(query) {
		return fmt.Errorf("query must be a single read-only SELECT statement")
	}
	if len(tables) == 0 {
		return nil
	}

	tableMap := make(map[string]struct{}, len(tables))
	for _, table := range tables {
		tableName := strings.TrimSpace(table.Name)
		if tableName != "" {
			tableMap[strings.ToLower(tableName)] = struct{}{}
		}
	}
	tableNames := ReferencedTables(query, explicitTableNames, tables)
	if len(tableNames) == 0 {
		return fmt.Errorf("query must reference a supported datasource table")
	}
	for _, tableName := range tableNames {
		if _, ok := tableMap[strings.ToLower(tableName)]; !ok {
			return fmt.Errorf("unsupported datasource table: %s", tableName)
		}
	}
	return nil
}

func QueryWithRowLimit(query string, rowLimit int64) string {
	normalized := strings.TrimSpace(query)
	normalized = strings.TrimSuffix(normalized, ";")
	if rowLimit <= 0 {
		return normalized
	}
	return fmt.Sprintf("SELECT * FROM (%s) AS datasource_query LIMIT %d", normalized, rowLimit)
}
