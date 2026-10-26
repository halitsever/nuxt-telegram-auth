# Changelog

## v2.0.0-beta.0

[compare changes](https://github.com/halitsever/nuxt-telegram-auth/compare/v1.4.0...v2.0.0-beta.0)

### 🚀 Enhancements

- ⚠️  Require nuxt 4.6 and add shared telegram user types ([f8e9ed6](https://github.com/halitsever/nuxt-telegram-auth/commit/f8e9ed6))
- Add v2 configuration with oidc settings ([be869d6](https://github.com/halitsever/nuxt-telegram-auth/commit/be869d6))
- Add sealed cookie storage for sessions ([6973ae4](https://github.com/halitsever/nuxt-telegram-auth/commit/6973ae4))
- Add the login pipeline and server hooks ([20adfe8](https://github.com/halitsever/nuxt-telegram-auth/commit/20adfe8))
- ⚠️  Move legacy widget logins to the sealed session ([d461521](https://github.com/halitsever/nuxt-telegram-auth/commit/d461521))
- ⚠️  Add useTelegramSession and keep useUserSession as a deprecated alias ([d6e6e8d](https://github.com/halitsever/nuxt-telegram-auth/commit/d6e6e8d))
- Verify telegram id tokens with jose ([83a871a](https://github.com/halitsever/nuxt-telegram-auth/commit/83a871a))
- Add pkce, state and nonce helpers ([ff974de](https://github.com/halitsever/nuxt-telegram-auth/commit/ff974de))
- Add the oidc redirect login ([a88dd29](https://github.com/halitsever/nuxt-telegram-auth/commit/a88dd29))
- Add the popup sdk login endpoints ([52743d1](https://github.com/halitsever/nuxt-telegram-auth/commit/52743d1))
- Add useTelegramLogin with the telegram login sdk ([b9d9631](https://github.com/halitsever/nuxt-telegram-auth/commit/b9d9631))
- Add the telegram login button ([7c999d6](https://github.com/halitsever/nuxt-telegram-auth/commit/7c999d6))
- Add page protection with definePageMeta ([bac2f16](https://github.com/halitsever/nuxt-telegram-auth/commit/bac2f16))

### 🩹 Fixes

- Leave the session to the browser on prerendered and cached pages ([79ad112](https://github.com/halitsever/nuxt-telegram-auth/commit/79ad112))
- Keep the oidc transaction cookie lax with a strict session cookie ([aa63bdf](https://github.com/halitsever/nuxt-telegram-auth/commit/aa63bdf))

### 📖 Documentation

- Note that telegram draws one login button per bot ([e76b6b2](https://github.com/halitsever/nuxt-telegram-auth/commit/e76b6b2))
- Document telegram login, sessions and the 2.0 migration ([87c9bbd](https://github.com/halitsever/nuxt-telegram-auth/commit/87c9bbd))
- Show a server plugin that works with nuxt 5 compatibility ([95e8329](https://github.com/halitsever/nuxt-telegram-auth/commit/95e8329))

### 🏡 Chore

- Refresh the lockfile to pick up security fixes ([dfa1094](https://github.com/halitsever/nuxt-telegram-auth/commit/dfa1094))
- Keep author emails out of the changelog ([d48f59c](https://github.com/halitsever/nuxt-telegram-auth/commit/d48f59c))

### ✅ Tests

- Register fixture hooks without nitro auto-imports ([49fc237](https://github.com/halitsever/nuxt-telegram-auth/commit/49fc237))

### 🤖 CI

- Release 2.0 betas from the v2 branch ([fef3e1d](https://github.com/halitsever/nuxt-telegram-auth/commit/fef3e1d))
- Fix a stray quote in the release workflow ([0b3a8e2](https://github.com/halitsever/nuxt-telegram-auth/commit/0b3a8e2))

#### ⚠️ Breaking Changes

- ⚠️  Require nuxt 4.6 and add shared telegram user types ([f8e9ed6](https://github.com/halitsever/nuxt-telegram-auth/commit/f8e9ed6))
- ⚠️  Move legacy widget logins to the sealed session ([d461521](https://github.com/halitsever/nuxt-telegram-auth/commit/d461521))
- ⚠️  Add useTelegramSession and keep useUserSession as a deprecated alias ([d6e6e8d](https://github.com/halitsever/nuxt-telegram-auth/commit/d6e6e8d))

### ❤️ Contributors

- Halit Sever ([@halitsever](https://github.com/halitsever))

## v1.4.0

[compare changes](https://github.com/halitsever/nuxt-telegram-auth/compare/v1.3.7...v1.4.0)

### 🚀 Enhancements

- Set the session cookie on the server ([8adf055](https://github.com/halitsever/nuxt-telegram-auth/commit/8adf055))
- Add a callback route for redirect mode ([143a37a](https://github.com/halitsever/nuxt-telegram-auth/commit/143a37a))
- Read the bot token from telegramAuth.botToken ([aff186c](https://github.com/halitsever/nuxt-telegram-auth/commit/aff186c))
- Export session types from the module entry ([35f60ca](https://github.com/halitsever/nuxt-telegram-auth/commit/35f60ca))
- **widget:** Send logins to the server and add lang and redirect-to props ([c6ea92a](https://github.com/halitsever/nuxt-telegram-auth/commit/c6ea92a))

### 🩹 Fixes

- Verify telegram data with web crypto ([f98533a](https://github.com/halitsever/nuxt-telegram-auth/commit/f98533a))

### 📖 Documentation

- Note that 1.3.6 shipped without the fixes ([db7f810](https://github.com/halitsever/nuxt-telegram-auth/commit/db7f810))
- Update readme for the server-side session ([390d3ac](https://github.com/halitsever/nuxt-telegram-auth/commit/390d3ac))
- Document the bot token, sessions and redirect mode ([a736890](https://github.com/halitsever/nuxt-telegram-auth/commit/a736890))
- Add a security policy and contributing guide ([724b1fc](https://github.com/halitsever/nuxt-telegram-auth/commit/724b1fc))

### 🏡 Chore

- Set up pnpm workspace and drop stale lockfiles ([4b4e6fc](https://github.com/halitsever/nuxt-telegram-auth/commit/4b4e6fc))
- Upgrade dev dependencies ([8c86339](https://github.com/halitsever/nuxt-telegram-auth/commit/8c86339))
- Add package metadata and nuxt compatibility ([71063b3](https://github.com/halitsever/nuxt-telegram-auth/commit/71063b3))
- Group dependabot updates ([3226296](https://github.com/halitsever/nuxt-telegram-auth/commit/3226296))
- Ignore major typescript and node types updates in dependabot ([ef2b540](https://github.com/halitsever/nuxt-telegram-auth/commit/ef2b540))
- Move pnpm settings into pnpm-workspace.yaml ([bb9cafe](https://github.com/halitsever/nuxt-telegram-auth/commit/bb9cafe))
- Add issue and pull request templates ([f562019](https://github.com/halitsever/nuxt-telegram-auth/commit/f562019))

### 🤖 CI

- Run type checks and tests on node 22, 24 and 26 ([ceb86b8](https://github.com/halitsever/nuxt-telegram-auth/commit/ceb86b8))
- Publish releases from github actions ([a8d730b](https://github.com/halitsever/nuxt-telegram-auth/commit/a8d730b))
- Update docs workflow ([350c379](https://github.com/halitsever/nuxt-telegram-auth/commit/350c379))
- Keep changelogen from creating github releases on its own ([d7ee03a](https://github.com/halitsever/nuxt-telegram-auth/commit/d7ee03a))

### ❤️ Contributors

- Halit Sever ([@halitsever](https://github.com/halitsever))

## v1.3.7

[compare changes](https://github.com/halitsever/nuxt-telegram-auth/compare/v1.3.6...v1.3.7)

### 🩹 Fixes

- Restore session composable and widget broken in 1.3.5 ([f4ac782](https://github.com/halitsever/nuxt-telegram-auth/commit/f4ac782))

### 🤖 CI

- Build an app against the packed module ([8835083](https://github.com/halitsever/nuxt-telegram-auth/commit/8835083))

### ❤️ Contributors

- Halit Sever ([@halitsever](https://github.com/halitsever))

## v1.3.6

[compare changes](https://github.com/halitsever/nuxt-telegram-auth/compare/v1.3.5...v1.3.6)

This version was published without the fixes from #265 and still has the 1.3.5 build failure. Use 1.3.7 or later.

## v1.2.6

[compare changes](https://github.com/halitsever/nuxt-telegram-auth/compare/v1.2.5...v1.2.6)

### 🩹 Fixes

- **session.get:** Handle nullish telegram token ([bb97043](https://github.com/halitsever/nuxt-telegram-auth/commit/bb97043))

### ❤️ Contributors

- Halit Sever ([@halitsever](https://github.com/halitsever))

## v1.2.5

[compare changes](https://github.com/halitsever/nuxt-telegram-auth/compare/v1.2.4...v1.2.5)

### 🩹 Fixes

- Remove module options ([b721fd6](https://github.com/halitsever/nuxt-telegram-auth/commit/b721fd6))

### ❤️ Contributors

- Halit Sever ([@halitsever](https://github.com/halitsever))

## v1.2.4

[compare changes](https://github.com/halitsever/nuxt-telegram-auth/compare/v1.2.3...v1.2.4)

### 📖 Documentation

- Update docs workflow ([bd91510](https://github.com/halitsever/nuxt-telegram-auth/commit/bd91510))

### 🏡 Chore

- Upgrade dependency versions ([2765271](https://github.com/halitsever/nuxt-telegram-auth/commit/2765271))
- Add compatibilityDate to nuxt.config ([6760493](https://github.com/halitsever/nuxt-telegram-auth/commit/6760493))

### ❤️ Contributors

- Halit Sever ([@halitsever](https://github.com/halitsever))

## v1.2.3

[compare changes](https://github.com/halitsever/nuxt-telegram-auth/compare/v1.2.2...v1.2.3)

## v1.2.2

[compare changes](https://github.com/halitsever/nuxt-telegram-auth/compare/v1.2.0...v1.2.2)

### 🩹 Fixes

- 🐛 eslint integration ([3c9754f](https://github.com/halitsever/nuxt-telegram-auth/commit/3c9754f))
- 🐛 test workflow ([34d20d8](https://github.com/halitsever/nuxt-telegram-auth/commit/34d20d8))
- 🐛 typo prepare:dev => dev:prepare ([da26bc3](https://github.com/halitsever/nuxt-telegram-auth/commit/da26bc3))
- **telegramloginwidget:** Update btoa function for utf8 ([a3ce167](https://github.com/halitsever/nuxt-telegram-auth/commit/a3ce167))

### 📖 Documentation

- ✏️ update features section ([fc44579](https://github.com/halitsever/nuxt-telegram-auth/commit/fc44579))
- ✏️ update features section ([fcf1c1e](https://github.com/halitsever/nuxt-telegram-auth/commit/fcf1c1e))
- Update image aligments ([dd39167](https://github.com/halitsever/nuxt-telegram-auth/commit/dd39167))

### 🏡 Chore

- 🤖 add npm run lint to release script ([269ced5](https://github.com/halitsever/nuxt-telegram-auth/commit/269ced5))
- **deps-dev:** Bump nuxt from 3.12.3 to 3.12.4 ([168e5e5](https://github.com/halitsever/nuxt-telegram-auth/commit/168e5e5))
- **deps-dev:** Bump serve-static from 1.15.0 to 1.16.2 ([ae66e1f](https://github.com/halitsever/nuxt-telegram-auth/commit/ae66e1f))
- **deps-dev:** Bump @types/node from 20.14.10 to 22.7.4 ([bd9663d](https://github.com/halitsever/nuxt-telegram-auth/commit/bd9663d))
- **deps-dev:** Bump vite from 5.3.5 to 5.4.8 ([b1149f4](https://github.com/halitsever/nuxt-telegram-auth/commit/b1149f4))
- **deps-dev:** Bump @nuxt/schema from 3.12.4 to 3.13.2 ([1c62687](https://github.com/halitsever/nuxt-telegram-auth/commit/1c62687))
- **deps-dev:** Bump eslint from 9.6.0 to 9.12.0 ([3418ff4](https://github.com/halitsever/nuxt-telegram-auth/commit/3418ff4))
- **deps-dev:** Bump vitest from 1.6.0 to 2.1.2 ([3bb8589](https://github.com/halitsever/nuxt-telegram-auth/commit/3bb8589))
- **deps-dev:** Bump rollup from 3.29.4 to 3.29.5 ([7551df1](https://github.com/halitsever/nuxt-telegram-auth/commit/7551df1))
- **deps-dev:** Bump vue-tsc from 2.0.26 to 2.1.6 ([4340bea](https://github.com/halitsever/nuxt-telegram-auth/commit/4340bea))
- **package.json:** Bump nuxt to 3.17.1 ([d4e28b5](https://github.com/halitsever/nuxt-telegram-auth/commit/d4e28b5))

### ❤️ Contributors

- Halit Sever ([@halitsever](http://github.com/halitsever))
