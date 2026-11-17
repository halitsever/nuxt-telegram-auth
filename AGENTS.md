# AGENTS.md

nuxt-telegram-auth is a Nuxt module on npm. Nuxt 4.6+ apps use it to log people in with Telegram (popup button or OpenID Connect redirect) and keep the session in a sealed cookie.

## Verify a change

Use the pnpm version pinned in `packageManager` (`corepack enable`) and Node 24 from `.nvmrc`. CI (`.github/workflows/ci.yml`) runs:

- `pnpm install`
- `pnpm run lint`
- `pnpm run dev:prepare`. CI runs it before every step below, and `scripts/pack-smoke.sh` expects it to have run.
- `pnpm run test:types`
- `pnpm run test` on Node 22, 24 and 26
- `bash scripts/pack-smoke.sh`, which builds a fresh Nuxt app against the packed module
- Non-blocking: `NUXT_TEST_COMPAT=5 pnpm exec vitest run --project e2e` checks Nuxt 5 compatibility

## Gotchas

- `test/unit/workflows.test.ts` runs `bash -n` on every `run:` script in `.github/workflows`, so `pnpm test` also catches a broken workflow edit.
- There is no format check in CI and no pre-commit hook. Run `npx prettier --write` on the files you touch (printWidth 220, double quotes).
- Dependency overrides live in `pnpm-workspace.yaml`, not in package.json.
- Trying a real bot needs `playground/.env` (copy `.env.example`) and an HTTPS tunnel listed in the bot's Allowed URLs. CONTRIBUTING.md has the steps.
- Releases come from the manual `release` workflow. changelogen picks the bump from commit types, writes CHANGELOG.md and tags. The workflow then publishes with provenance and refuses a prerelease under `latest`.

## Docs site

- VitePress source lives in `docs/`, with the config in `docs/.vitepress/config.ts` and base `/nuxt-telegram-auth/`. It is served at https://halitsever.github.io/nuxt-telegram-auth/ with `.html` page URLs.
- `.github/workflows/docs.yaml` deploys on pushes to `main` that touch `docs/**`.
- A new page needs a `description` line in its frontmatter, a sidebar entry in the config and a line in `docs/public/llms.txt`. The sitemap, canonical and `og:url` tags are generated.

## Conventions

- Commit messages are a conventional-commit subject line in English, with no body and no trailer. The changelog is generated from them.
- Work on a branch and open a PR against `main`. The owner merges.
- New text carries no emoji. Code comments stay short, one line where possible, and explain why.
- The README follows the owner's template. Every image served from `halitsever-api.vercel.app` stays byte-for-byte. Only the `title=` value of `api/repo-title` and the link around `api/issue` may be corrected.
- The owner bumps versions and runs the release workflow that publishes to npm.
