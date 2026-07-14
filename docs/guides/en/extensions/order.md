# Order Extension (legacy)

> **To be removed after migration**: the `order` extension (`extension.order.*`) is legacy. The redesigned, `id`-based [Commerce extension](commerce.md) supersedes it, and once every app has migrated to `commerce` the `order` extension is removed. **Use `commerce` for new development.**

The legacy `order` extension provides the `createdAt`-based `Order` model and the `extension.order.*` functions (order lookup plus cancel/return/exchange claim actions).

`commerce` is the redesign of this extension. The main differences are:

- adds a `buyer` field
- `createdAt` → `orderedAt`
- wraps action responses in `ActionResult`
- adds a `returnAcceptOrder` (return pickup completed) function

See the [Commerce extension](commerce.md) for the full function list and usage.
