package registry

import "fmt"

type Owner string

const (
	OwnerSDK    Owner = "sdk"
	OwnerLegacy Owner = "legacy"
)

type OwnerTable map[string]Owner

func (t OwnerTable) Register(method string, owner Owner) error {
	if method == "" {
		return fmt.Errorf("method is required")
	}
	if existing, ok := t[method]; ok && existing != owner {
		return fmt.Errorf("method %s already owned by %s", method, existing)
	}
	t[method] = owner
	return nil
}
