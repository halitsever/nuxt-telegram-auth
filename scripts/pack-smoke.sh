#!/usr/bin/env bash
# Builds a fresh Nuxt app against the packed tarball, the way users install the module.
# Run after `pnpm install` and `pnpm dev:prepare`.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

cd "$root"
pnpm pack --pack-destination "$work"

cp -r test/fixtures/packed "$work/app"
cd "$work/app"
npm install --no-audit --no-fund "$work"/nuxt-telegram-auth-*.tgz nuxt@^4
npx nuxi build
