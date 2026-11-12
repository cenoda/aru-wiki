---
name: push
description: Push aru-wiki commits to GitHub (cenoda/aru-wiki). Use when the user asks to push, upload to GitHub, or "깃허브 올려". Runs tests and build first. Pair with the deploy skill when the user also wants the live site updated.
---

# Push aru-wiki to GitHub

The user allowed this skill on 2026-11-12. Running it counts as their request to push.

1. `git status --short`: commit only the files you changed in this session. Do not add or commit files you did not touch; ask about them first.
   - Do not commit `public/img/characters/` (icons stay out of git, docs/image-policy.md 4), `dist/` or `data/runtime/`.
   - End commit messages with the attribution line from the system reminder.
2. `npm test` and `npm run build` must both pass. If either fails, stop and report the output.
3. `git push -u origin <current branch>`. Retry only on network errors, up to 4 times (wait 2s, 4s, 8s, 16s). Never force-push without the user's explicit OK.
4. Report the pushed commit hash(es) in one line.

If the user also asked for the site to be updated ("서버 반영", "배포"), run the deploy skill next.
