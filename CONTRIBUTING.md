# Contributing

Thanks for helping out!

## Setup

You need Node.js 24 (see `.nvmrc`) and pnpm.

```bash
nvm use
corepack enable
pnpm install
pnpm dev:prepare
pnpm dev
```

`pnpm dev` starts the playground in `playground/` with the module loaded from `src/`.

## Checks

Run these before you open a pull request:

```bash
pnpm lint
pnpm test:types
pnpm test
bash scripts/pack-smoke.sh
```

`pnpm test` covers the end-to-end tests against the apps in `test/fixtures`, the unit tests in `test/unit` and the component tests in `test/nuxt`. The pack smoke script builds a fresh Nuxt app against the packed module, the way users install it.

## Testing with a real bot

Telegram only sends a login back to addresses on the bot's Allowed URLs list, so the easiest way to try the playground with a real bot is through an HTTPS tunnel:

1. Copy `playground/.env.example` to `playground/.env` and fill in the client ID and secret from the BotFather Mini App (Bot Settings → Login Widget).
2. Run `pnpm dev`, and in a second terminal `cloudflared tunnel --url http://localhost:3000`.
3. Add the tunnel's address and `<tunnel address>/auth/telegram/callback` to the bot's Allowed URLs.
4. Open `<tunnel address>/login`.

A quick tunnel gets a new address every time it starts, so step 3 repeats with it.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org) (`fix:`, `feat:`, `docs:`, `chore:` and so on). The changelog and the version bump are generated from them.

## Releases

Releases run from the **release** workflow in GitHub Actions. Start it with `dry_run` checked first. A real run bumps the version, updates the changelog, publishes to npm with provenance and creates the GitHub release.

Until 2.0 is out, 2.x work happens on the `v2` branch and pull requests go there. Betas are released from `v2` with bump `premajor` for the first one and `prerelease` after that, under the npm tag `next`. The workflow refuses other combinations on `v2`, and never publishes a prerelease as `latest`.
