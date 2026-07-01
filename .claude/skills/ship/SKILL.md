---
name: ship
description: Commit, open a PR, run code review, wait for CI checks, merge into main, and sync local main. Use when a feature branch is ready to go all the way to main.
disable-model-invocation: true
---

When the user invokes `/ship $ARGUMENTS`:

1. **Check branch** — ensure the user is not on `main`. If on `main`, stop and tell them to create a feature branch first.

2. **Run tests** — `npm test`. If tests fail, stop and report the failure. Do not proceed until tests pass.

3. **Run lint** — `npm run lint:prettier:fix && npm run lint:eslint:check`. Fix any auto-fixable issues; report others.

4. **Stage and commit** — use `npm run commit` for interactive conventional-commit prompting, OR if `$ARGUMENTS` contains a commit message, use it directly as `git commit -m "$ARGUMENTS"`. Must follow Conventional Commits format.

5. **Push and open PR** — `git push -u origin HEAD` then `gh pr create --fill`. Capture the PR number from the output for later steps.

6. **Code review** — invoke the `/code-review` skill against the PR's diff.

   - If it reports confirmed findings, apply the fixes, then re-run `npm test` and lint (steps 2–3).
   - If any file changed, commit (`fix:`/`refactor:` as appropriate) and push again.
   - If no findings survive, continue.

7. **Wait for CI checks** — `gh pr checks <number> --watch`. This blocks until all checks finish.

   - If any required check fails, stop. Report which check failed and its log/output. Do not merge.
   - Do not retry-loop or force-skip failing checks — surface them for the user to fix.

8. **Merge** — once all checks are green, merge with `gh pr merge <number> --squash --delete-branch`. This is a hard-to-reverse, shared-state action — if `$ARGUMENTS` did not already signal the user wants a full unattended run, confirm before merging.

9. **Sync local main** — `git checkout main && git pull origin main` so the local branch reflects the merge, then `git branch -d <feature-branch>` to remove the now-stale local branch (its remote was already deleted in step 8).

10. **Sync the wiki** — if the personal `wiki-sync` skill is available, invoke `/wiki-sync` with the merged PR number. It opens its own PR against `wiki/` — do not merge that PR automatically; report its URL and leave it for the user to review. If `wiki-sync` isn't installed (e.g. a fresh clone of this template on another machine), skip this step silently — it's a personal skill, not a project dependency.

Constraints:

- Never commit directly to `main`.
- Tests must pass before committing and before merging.
- Migrations (if any) must be applied and tested before opening the PR — see `db-migrate` skill.
- Never merge with failing or pending required checks.
- Never auto-merge the wiki-sync PR — it requires human review.
- Always use Conventional Commits format.
