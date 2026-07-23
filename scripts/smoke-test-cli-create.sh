#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
temporary_dir="$(mktemp -d)"
trap 'rm -rf "$temporary_dir"' EXIT

cd "$temporary_dir"
node "$root_dir/ts/packages/cli/dist/cli.js" create smoke-app
cd smoke-app
corepack pnpm install --ignore-scripts --reporter=silent
corepack pnpm build
corepack pnpm typecheck
