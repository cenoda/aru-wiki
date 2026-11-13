#!/usr/bin/env bash
# Deploy the whole-wiki articles saved at the end of the last chunk (run-chunks.sh), while the run
# goes on in the main working tree: commit the ready copy (and the LLM-written names) on top of
# origin/main in a separate worktree, test, build, push and rsync (same steps as the deploy skill).
#   bash scripts/theme/publish-ready.sh      → prints "nothing new" or the deployed commit
set -euo pipefail
cd "$(dirname "$0")/../.."
MAIN=$PWD
READY=.cache/theme/articles-all.ready      # one file per page (scripts/theme/article-store.mjs)
READY_MARK=$READY.stamp                    # touched by run-chunks.sh when it saves a ready copy
STAMP=.cache/theme/published.stamp
[ -d "$READY" ] || { echo "no ready copy yet"; exit 0; }
if [ -f "$STAMP" ] && [ ! "$READY_MARK" -nt "$STAMP" ] && [ ! data/manual/ko-names-llm.json -nt "$STAMP" ] && [ ! data/manual/ko-rewrite.json -nt "$STAMP" ]; then echo "nothing new"; exit 0; fi
WT=/tmp/aru-publish
git worktree remove --force "$WT" 2>/dev/null || true
git fetch -q origin main
git worktree add -q --detach "$WT" origin/main
trap 'cd "$MAIN"; git worktree remove --force "$WT" 2>/dev/null || true' EXIT
# only a copy with more articles than GitHub's goes up: another session's name fixes rewrite articles-all.json there,
# and an older ready copy with the same articles would undo them (2026-11-13: 쿠바키, 기문술 put back)
had=$(node scripts/theme/article-store.mjs count "$WT/data/generated/articles-all")
new=$(node scripts/theme/article-store.mjs count "$MAIN/$READY")
if [ "$new" -le "$had" ] && [ "${FORCE:-}" != 1 ]; then echo "ready copy has $new articles, GitHub $had: not used"; touch "$MAIN/$STAMP"; exit 0; fi
rsync -a --delete "$READY/" "$WT/data/generated/articles-all/"
cp data/manual/ko-names-llm.json "$WT/data/manual/ko-names-llm.json"
cp data/manual/ko-rewrite.json "$WT/data/manual/ko-rewrite.json"
# hand fixes added while the chunk ran (its articles.mjs read ko-rewrite.json when it started)
node scripts/theme/apply-rewrites.mjs "$WT/data/generated/articles-all"
cd "$WT"
ln -s "$MAIN/node_modules" node_modules
mkdir -p public/img && cp -r "$MAIN/public/img/characters" public/img/
n=$(node scripts/theme/article-store.mjs count data/generated/articles-all)
if git diff --quiet && [ -z "$(git ls-files --others --exclude-standard data/generated/articles-all)" ]; then echo "nothing to commit ($n articles)"; else
  git add -A data/generated/articles-all data/manual/ko-names-llm.json data/manual/ko-rewrite.json
  git commit -q -m "data(wiki): whole-wiki articles, $n pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
fi
npm test 2>&1 | grep -q "^# fail 0" || { echo "tests failed"; exit 1; }
npm run build > /tmp/aru-publish-build.log 2>&1 || { echo "build failed: /tmp/aru-publish-build.log"; exit 1; }
git push -q origin HEAD:main
rsync -az --delete -e "ssh -i $HOME/.ssh/aru-deploy" dist/ ubuntu@147.224.187.173:/srv/aru/site/
code=$(curl -s -o /dev/null -w "%{http_code}" https://aru.wiki/)
touch "$MAIN/$STAMP"
echo "deployed $(git rev-parse --short HEAD): $n articles, https://aru.wiki/ $code"
