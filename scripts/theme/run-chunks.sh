#!/usr/bin/env bash
# Whole-wiki articles in chunks of 400 (main pages first). Each chunk ends with the name swap and
# clean-up of articles.mjs, so what is saved between chunks is ready to deploy. Stops when a chunk
# finds nothing left. Logs: .cache/theme/chunk-<n>.log
#   setsid nohup bash scripts/theme/run-chunks.sh > .cache/theme/chunks.log 2>&1 &
cd "$(dirname "$0")/../.."
export LLM_SLOTS="${LLM_SLOTS:-ds=12,ds-pro=8,or-ds=300,glm=4,glm-flash=4,kimi=4,claude-sonnet=8}"
n=$(( $(ls .cache/theme/chunk-*.log 2>/dev/null | sed "s/[^0-9]//g" | sort -n | tail -1) + 1 ))  # after the last chunk log, not over it
while :; do
  log=.cache/theme/chunk-$n.log
  echo "$(date -u +%FT%TZ) chunk $n start"
  node scripts/theme/articles.mjs all --latest --order units --skip-theme khaenriah --limit "${CHUNK:-400}" \
    --writer kimi,ds,ds-pro,glm-flash,or-ds,glm --verify claude-sonnet,codex-medium,grok --polish ds,glm-flash,or-ds,kimi --jobs "${JOBS:-96}" > "$log" 2>&1
  status=$?
  echo "$(date -u +%FT%TZ) chunk $n end: $(grep -c paragraphs "$log") written, $(grep -c '^error' "$log") errors"
  # between chunks the file holds Korean names and clean-up; mid-chunk saves do not (articles.mjs
  # swaps names at the end): publish-ready.sh deploys this copy
  # only after a chunk that ran to its end (a killed chunk leaves its names unswapped)
  if [ $status -eq 0 ] && grep -q "LLM calls" "$log"; then rsync -a --delete data/generated/articles-all/ .cache/theme/articles-all.ready/ && touch .cache/theme/articles-all.ready.stamp; fi
  grep -q '^0 articles to check' "$log" && { echo "nothing left"; break; }
  n=$((n + 1))
done
