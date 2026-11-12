#!/usr/bin/env bash
# Whole-wiki articles in chunks of 100 (main pages first). Each chunk ends with the name swap and
# clean-up of articles.mjs, so what is saved between chunks is ready to deploy. Stops when a chunk
# finds nothing left. Logs: .cache/theme/chunk-<n>.log
#   setsid nohup bash scripts/theme/run-chunks.sh > .cache/theme/chunks.log 2>&1 &
cd "$(dirname "$0")/../.."
export LLM_SLOTS="${LLM_SLOTS:-ds=12,ds-pro=8,glm=4,kimi=4,claude-sonnet=8}"
n=1
while :; do
  log=.cache/theme/chunk-$n.log
  echo "$(date -u +%FT%TZ) chunk $n start"
  node scripts/theme/articles.mjs all --latest --order units --skip-theme khaenriah --limit "${CHUNK:-100}" \
    --writer kimi,ds,ds-pro,glm --verify claude-sonnet,codex-medium,grok --polish ds,kimi --jobs 16 > "$log" 2>&1
  echo "$(date -u +%FT%TZ) chunk $n end: $(grep -c paragraphs "$log") written, $(grep -c '^error' "$log") errors"
  grep -q '^0 articles to check' "$log" && { echo "nothing left"; break; }
  n=$((n + 1))
done
