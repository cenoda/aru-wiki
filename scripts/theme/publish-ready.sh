#!/usr/bin/env bash
# Deploy the whole-wiki articles saved at the end of the last chunk (run-chunks.sh), while the run
# goes on in the main working tree: commit the ready copy (and the LLM-written names) on top of
# origin/main in a separate worktree, test, build, push and rsync (same steps as the deploy skill).
#   bash scripts/theme/publish-ready.sh      → prints "nothing new" or the deployed commit
set -euo pipefail
cd "$(dirname "$0")/../.."
MAIN=$PWD
READY=.cache/theme/articles-all.ready.json
STAMP=.cache/theme/published.stamp
[ -f "$READY" ] || { echo "no ready copy yet"; exit 0; }
if [ -f "$STAMP" ] && [ ! "$READY" -nt "$STAMP" ] && [ ! data/manual/ko-names-llm.json -nt "$STAMP" ]; then echo "nothing new"; exit 0; fi
WT=/tmp/aru-publish
git worktree remove --force "$WT" 2>/dev/null || true
git fetch -q origin main
git worktree add -q --detach "$WT" origin/main
trap 'cd "$MAIN"; git worktree remove --force "$WT" 2>/dev/null || true' EXIT
cp "$READY" "$WT/data/generated/articles-all.json"
cp data/manual/ko-names-llm.json "$WT/data/manual/ko-names-llm.json"
cd "$WT"
ln -s "$MAIN/node_modules" node_modules
mkdir -p public/img && cp -r "$MAIN/public/img/characters" public/img/
n=$(node -e 'console.log(require("./data/generated/articles-all.json").articles.length)')
if git diff --quiet; then echo "nothing to commit ($n articles)"; else
  git add data/generated/articles-all.json data/manual/ko-names-llm.json
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
