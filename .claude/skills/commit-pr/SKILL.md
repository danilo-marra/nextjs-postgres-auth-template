---
name: commit-pr
description: Conventional commit, run tests, push branch, and open a GitHub PR. Use when ready to ship a feature or fix.
disable-model-invocation: true
---

When the user invokes `/commit-pr $ARGUMENTS`:

1. **Check branch** — ensure the user is not on `main`. If on `main`, stop and tell them to create a feature branch first.

2. **Run tests** — `npm test`. If tests fail, stop and report the failure. Do not proceed until tests pass.

3. **Run lint** — `npm run lint:prettier:fix && npm run lint:eslint:check`. Fix any auto-fixable issues; report others.

4. **Stage and commit** — use `npm run commit` for interactive conventional-commit prompting, OR if $ARGUMENTS contains a commit message, use it directly as `git commit -m "$ARGUMENTS"`. The message must follow Conventional Commits format (`feat:`, `fix:`, `chore:`, etc.).

5. **Push branch** — `git push -u origin HEAD`.

6. **Open PR** — `gh pr create --fill` (uses branch name and commit message as title/body). If `gh` is not installed, print the GitHub URL to open manually.

Constraints:

- Never commit directly to `main`
- Tests must pass before committing
- Always use Conventional Commits format
