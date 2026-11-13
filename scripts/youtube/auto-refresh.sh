#!/usr/bin/env bash
# Scheduled refresh of the official-video list (docs/image-policy.md 4-1; YouTube API policy III.E.4:
# stored API data is refreshed or deleted within 30 days). Run by cron on the 1st and 15th
# (user approval 2026-11-13: it may commit videos.json to main, push and deploy without asking).
# Works in its own worktree (~/projects/aru-wiki-refresh) on origin/main, so the main checkout and
# its uncommitted work are never touched. Log: ~/.local/state/aru-refresh.log
set -euo pipefail
export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin"
MAIN="$HOME/projects/aru-wiki"
R="$HOME/projects/aru-wiki-refresh"
log() { echo "$(date -u +%FT%TZ) $*"; }

retry() { local i; for i in 1 2 3 4; do "$@" && return 0; sleep $((i * 5)); done; return 1; }

[ -d "$R" ] || git -C "$MAIN" worktree add -q --detach "$R" origin/main
cd "$R"
retry git fetch -q origin main
git reset -q --hard origin/main
[ -e node_modules ] || ln -s "$MAIN/node_modules" node_modules

log "refresh from $(git rev-parse --short HEAD)"
with-youtube node scripts/youtube/refresh.mjs
git add data/generated/videos.json
git -c user.name="aru-wiki refresh" -c user.email="contact@aru.wiki" commit -q -m "chore(videos): scheduled refresh of the official-video list" || log "nothing to commit"
# main may have moved while we ran: rebase onto it and push again
pushed=0
for i in 1 2 3 4; do
  if git push -q origin HEAD:refs/heads/main; then pushed=1; break; fi
  sleep $((i * 5)); git fetch -q origin main && git rebase -q origin/main
done
[ "$pushed" = 1 ] || { log "push failed"; exit 1; }
log "pushed $(git rev-parse --short HEAD)"

npm run fetch:icons >/dev/null
npm run build >/dev/null
rsync -az --delete -e "ssh -i $HOME/.ssh/aru-deploy" dist/ ubuntu@147.224.187.173:/srv/aru/site/
code=$(curl -s -o /dev/null -w "%{http_code}" https://aru.wiki/ || true)
[ "$code" = 200 ] || { sleep 10; code=$(curl -s -o /dev/null -w "%{http_code}" https://aru.wiki/ || true); }
log "deployed $(git rev-parse --short HEAD), site $code"
[ "$code" = 200 ]
