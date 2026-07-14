#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

private_patterns=(
  "ch-app""-store"
  "ch-drop""wizard"
  "ch-pro""to"
  "mail"".exp.channel.io"
  "sell""mate"
)

failed=0
for pattern in "${private_patterns[@]}"; do
  if rg --hidden --glob '!.git/**' --glob '!scripts/check-public-content.sh' \
    --fixed-strings --ignore-case --line-number "$pattern" .; then
    echo "Public content policy violation: prohibited private identifier found."
    failed=1
  fi
done

if rg --hidden --glob '!.git/**' --line-number 'AS-[0-9]{3,}' .; then
  echo "Public content policy violation: internal task identifier found."
  failed=1
fi

if [[ ! -f LICENSE ]]; then
  echo "Public content policy violation: LICENSE is missing."
  failed=1
fi

exit "$failed"
