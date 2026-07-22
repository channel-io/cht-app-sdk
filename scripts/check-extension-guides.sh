#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

locales=(en ko ja)
recipes=(
  config
  oauth
  apikey
  command
  widget
  customtab
  hook
  polling
  calendar
  store
  datasource
  commerce
  order
  wms
  messaging
  alf-task
  notebook
  mail-relay
)

failed=0
for locale in "${locales[@]}"; do
  overview="docs/guides/${locale}/extensions.md"
  for recipe in "${recipes[@]}"; do
    guide="docs/guides/${locale}/extensions/${recipe}.md"
    if [[ ! -f "$guide" ]]; then
      printf 'Missing %s Extension recipe: %s\n' "$locale" "$guide" >&2
      failed=1
      continue
    fi

    if ! rg --quiet '^## TypeScript' "$guide"; then
      printf 'Missing TypeScript section: %s\n' "$guide" >&2
      failed=1
    fi
    if ! rg --quiet '^## Go' "$guide"; then
      printf 'Missing Go section: %s\n' "$guide" >&2
      failed=1
    fi
    if ! rg --quiet --ignore-case 'test|verification|검증|테스트|検証' "$guide"; then
      printf 'Missing verification guidance: %s\n' "$guide" >&2
      failed=1
    fi
    if ! rg --quiet --fixed-strings "](extensions/${recipe}.md)" "$overview"; then
      printf 'Missing overview link for %s: %s\n' "$recipe" "$overview" >&2
      failed=1
    fi
  done
done

exit "$failed"
