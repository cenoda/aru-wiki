---
name: deploy
description: Deploy aru-wiki to the live site https://aru.wiki (OCI server). Use when the user asks to deploy, update the server, or "서버 반영". Fetches icons, builds, rsyncs dist/ to the server and checks the live site.
---

# Deploy aru-wiki to aru.wiki

The user allowed this skill on 2026-11-12. Running it counts as their request to deploy. Server details are in docs/status.md ("OCI 배포").

Deploy only what is on GitHub: run the push skill first if `main` has unpushed commits or the working tree has changes meant for the site.

1. `npm run fetch:icons`: downloads only the icons listed in `data/generated/image-files.json` that are missing locally. Icons are not in git, so skipping this step deploys a site without them.
2. `npm run build`: it must pass.
3. `rsync -az --delete -e "ssh -i ~/.ssh/aru-deploy" dist/ ubuntu@147.224.187.173:/srv/aru/site/`
   - Never print or copy the key. Use only `/srv/aru/site/`; do not touch Caddy, `aru-report` or other files on the server without asking.
4. Check the live site:
   - `curl -s -o /dev/null -w "%{http_code}\n" https://aru.wiki/` should print 200.
   - Request any newly added icon from `https://aru.wiki/img/characters/<Name>.png` and expect 200 with `image/png`. A single failure with code 000 can be a network blip; retry once before reporting it.
5. Report in one line: what was deployed (commit hash) and the check results.

If something fails, stop and report. Do not change the server setup to work around it.
