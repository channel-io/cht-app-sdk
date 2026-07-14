# Channel App SDK

Monorepo for Channel App SDKs.

## Layout

- `proto/`: shared SDK contracts.
- `go/`: Go SDK module.
- `ts/`: existing TypeScript SDK workspace and npm packages.
- `docs/guides`: app developer guides in Korean, English, and Japanese.
- `docs/reference`: protocol and SDK reference documents.
- `examples/go`: runnable Go examples.

## TypeScript

Existing npm packages keep their public package names and entrypoints.

```bash
cd ts
pnpm install
pnpm build
pnpm test
```

## Go

The Go SDK is a separate module under `go/` and is released with module tags such
as `go/v0.1.0`.

```bash
cd go
go test ./...
```

## Make Targets

```bash
make install
make lint
make build
make test
make verify
```

Language-specific targets are also available, such as `make build-ts`,
`make test-go`, `make lint-go`, and `make proto-lint`.

## Pull Requests

Before opening a pull request, run the relevant checks locally:

```bash
make lint
make build
make test
```

When changing protocol definitions or generated schemas, also commit the
generated files and run:

```bash
make proto-check
```

TypeScript package releases are managed with Changesets. Add a changeset for
any user-visible package change:

```bash
cd ts
pnpm changeset
```

Do not edit package versions or changelog release sections by hand. The release
workflow creates a release pull request, and packages are published to npm when
that pull request is merged.

The Go SDK is released separately from npm packages. Keep the Go module path as
`github.com/channel-io/cht-app-sdk/go`, and use Go module tags such as
`go/v0.1.0` for Go releases.

Because this repository is public, pull requests, commit messages, changelogs,
fixtures, screenshots, and generated files must not include private service
URLs, credentials, tokens, customer data, private repository names, internal task
IDs, or organization-specific UUIDs.

CI enforces this policy with `scripts/check-public-content.sh` and a secret
scan. Report suspected vulnerabilities privately as described in
[SECURITY.md](SECURITY.md).

## Guides

- [Korean](docs/guides/ko/README.md)
- [English](docs/guides/en/README.md)
- [Japanese](docs/guides/ja/README.md)

## Documentation

- [Agent Guide](AGENT.md) - Best entry point for humans and coding agents
- [TypeScript README](ts/README.md) - TypeScript SDK usage
- [TypeScript Auth and Tokens](docs/reference/typescript/AUTH-AND-TOKENS.md)
- [TypeScript Extensions](docs/reference/typescript/EXTENSIONS.md)
- [TypeScript WAM SDK](docs/reference/typescript/WAM.md)
- [TypeScript WAM UI](docs/reference/typescript/WAM-UI.md)
- [TypeScript CLI](docs/reference/typescript/CLI.md)
- [Go Feature Parity](docs/reference/go-feature-parity.md)

## License

MIT
