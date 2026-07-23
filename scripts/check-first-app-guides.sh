#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

locales=(en ko ja)
required_text=(
  'git clone https://github.com/channel-io/app-tutorial-ts.git'
  'git clone https://github.com/channel-io/app-tutorial.git'
  'corepack pnpm install --frozen-lockfile'
  'make test'
  'https://YOUR_HOST/functions'
  'https://YOUR_HOST/resource/wam'
  '/tutorial'
  'registerExtension(appId, extensionName, systemVersion)'
  'functions.md'
  '../../reference/typescript/ARCHITECTURE.md'
  '../../reference/go/README.md'
)
assets=(
  app-store-entry.png
  create-app.png
  app-id.png
  app-secret.png
  permissions.png
  endpoints.png
  tutorial-wam.png
  tutorial-result.png
)

failed=0
for locale in "${locales[@]}"; do
  guide="docs/guides/${locale}/quickstart.md"
  if [[ ! -f "$guide" ]]; then
    printf 'Missing first-app guide: %s\n' "$guide" >&2
    failed=1
    continue
  fi

  for expected in "${required_text[@]}"; do
    if ! grep -Fq "$expected" "$guide"; then
      printf 'Missing required first-app step in %s: %s\n' "$guide" "$expected" >&2
      failed=1
    fi
  done

  if [[ "$(grep -Fc '../../assets/first-app/' "$guide")" -ne "${#assets[@]}" ]]; then
    printf 'Expected %d first-app images in %s\n' "${#assets[@]}" "$guide" >&2
    failed=1
  fi

  if grep -Eiq 'developers\.channel\.io|registerCommands|window\.ChannelIOWam|app-store-api\.channel\.io' "$guide"; then
    printf 'Found retired implementation guidance in %s\n' "$guide" >&2
    failed=1
  fi

  index="docs/guides/${locale}/README.md"
  if ! grep -Eq '^1\. .*\(quickstart\.md\)' "$index"; then
    printf 'Quickstart must be the first document in %s\n' "$index" >&2
    failed=1
  fi
done

if ! grep -Fq '> **Building your first Channel app?**' README.md; then
  printf 'Root README must point first-time developers to Quickstart\n' >&2
  failed=1
fi

if ! grep -Fq '## Recommended Documentation Order' README.md; then
  printf 'Root README must publish the documentation reading order\n' >&2
  failed=1
fi

for asset in "${assets[@]}"; do
  path="docs/assets/first-app/${asset}"
  if [[ ! -s "$path" ]]; then
    printf 'Missing first-app image: %s\n' "$path" >&2
    failed=1
  fi
done

if grep -Riq 'developers\.channel\.io/.*/articles' docs/guides; then
  printf 'Localized SDK guides must not depend on retired developer articles\n' >&2
  failed=1
fi

exit "$failed"
