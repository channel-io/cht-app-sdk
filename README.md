# Channel App SDK

Monorepo for Channel App SDKs.

## Build A Channel App

If this is your first Channel app, start with a concept guide, prepare a private app and its
credentials, and then run the tutorial for your server language:

1. Concepts: [Korean](docs/guides/ko/concepts.md),
   [English](docs/guides/en/concepts.md), or [Japanese](docs/guides/ja/concepts.md)
2. End-to-end setup: [Korean](docs/guides/ko/app-development.md),
   [English](docs/guides/en/app-development.md), or
   [Japanese](docs/guides/ja/app-development.md)
3. Runnable app: [TypeScript tutorial](https://github.com/channel-io/app-tutorial-ts) or
   [Go tutorial](https://github.com/channel-io/app-tutorial)

The guides define the current contract. The tutorial repositories show the same contract as a
complete server-and-WAM app.

## Layout

- `proto/`: shared SDK contracts.
- `go/`: Go SDK module.
- `ts/`: existing TypeScript SDK workspace and npm packages.
- `docs/guides`: app developer guides in Korean, English, and Japanese.
- `docs/reference`: protocol and SDK reference documents.
- `skills/build-channel-app`: reusable Codex workflow for creating and reviewing apps.

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

Use the guides and references in this repository as the contract, then use these repositories as
runnable server-and-WAM examples:

- [TypeScript app tutorial](https://github.com/channel-io/app-tutorial-ts) — SDK-only NestJS server,
  typed native proxy, and React WAM hooks
- [Go app tutorial](https://github.com/channel-io/app-tutorial) — Go SDK server and React WAM; see
  [Go Feature Parity](docs/reference/go-feature-parity.md) for the remaining native-call gap

## Documentation

- [Agent Guide](AGENT.md) - Best entry point for humans and coding agents
- [Korean Concepts](docs/guides/ko/concepts.md), [English Concepts](docs/guides/en/concepts.md), [Japanese Concepts](docs/guides/ja/concepts.md)
- [TypeScript README](ts/README.md) - TypeScript SDK usage
- [TypeScript Auth and Tokens](docs/reference/typescript/AUTH-AND-TOKENS.md)
- [TypeScript Extensions](docs/reference/typescript/EXTENSIONS.md)
- [TypeScript WAM SDK](docs/reference/typescript/WAM.md)
- [TypeScript WAM UI](docs/reference/typescript/WAM-UI.md)
- [TypeScript CLI](docs/reference/typescript/CLI.md)
- [Go SDK Reference](docs/reference/go/README.md)
- [Go Functions and Schemas](docs/reference/go/FUNCTIONS.md)
- [Go Server and Routing](docs/reference/go/SERVER.md)
- [Go Auth and Tokens](docs/reference/go/AUTH-AND-TOKENS.md)
- [Go Extensions](docs/reference/go/EXTENSIONS.md)
- [Go Native Functions](docs/reference/go/NATIVE.md)
- [Go WAM Integration](docs/reference/go/WAM.md)
- [Go Feature Parity](docs/reference/go-feature-parity.md)
- [Build Channel App skill](skills/build-channel-app/SKILL.md)

## License

MIT
