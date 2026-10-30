<p align="center" class="logo-section">
<img src="https://i.ibb.co/MMcBdPN/nuxt-telegram-auth.png" height="80" width="80"/>
</br>
<img src="https://halitsever-api.vercel.app/api/repo-title?title=Nuxt%20Telegram%20Auth">

<p align="center">
🔐 Telegram Login for Nuxt
<br>
<br/>
<br/>
<a href="https://www.npmjs.com/package/nuxt-telegram-auth"><img alt="npm version" src="https://img.shields.io/npm/v/nuxt-telegram-auth"/></a>
<a href="https://www.npmjs.com/package/nuxt-telegram-auth"><img alt="npm downloads" src="https://img.shields.io/npm/d18m/nuxt-telegram-auth?label=downloads"/></a>
<a href="https://www.npmjs.com/package/nuxt-telegram-auth"><img alt="npm monthly downloads" src="https://img.shields.io/npm/dm/nuxt-telegram-auth"/></a>
<a href="https://github.com/halitsever/nuxt-telegram-auth/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/halitsever/nuxt-telegram-auth/ci.yml?branch=main"/></a>
<a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/halitsever/nuxt-telegram-auth"/></a>
<a href="https://nuxt.com"><img alt="Nuxt version" src="https://img.shields.io/npm/dependency-version/nuxt-telegram-auth/peer/nuxt?logo=nuxt&logoColor=white&color=00DC82"/></a>
<a href="https://github.com/sponsors/halitsever"><img alt="GitHub sponsors" src="https://img.shields.io/github/sponsors/halitsever"/></a>
</p>
<p align="center">
<a align="center" href="https://halitsever.github.io/nuxt-telegram-auth">Documentation</a>
  </p>
</p>

<p align="center">
<img src="https://halitsever-api.vercel.app/api/details"/>
</p>

- 😌 [**Telegram Login**](#) - A popup button or the OpenID Connect redirect, checked on the server
- 🔒 [**Sealed Sessions**](#) - One HttpOnly session cookie for every login method, no database needed
- 🛡️ [**Pages and Routes**](#) - `definePageMeta({ telegramAuth: true })` for pages, `requireTelegramSession(event)` for your API
- 🪝 [**Hooks**](#) - Save users, add roles or refuse a login from a server hook
  <p align="center" >
  <img src="https://halitsever-api.vercel.app/api/installation"/>
  </p>

Installation:

```bash
npx nuxi module add nuxt-telegram-auth
```

Turn on Telegram Login for your bot in the [@BotFather](https://t.me/BotFather) Mini App (Bot Settings → Login Widget), add your site to Allowed URLs, and put the client ID and a session secret in `.env`:

```bash
NUXT_PUBLIC_TELEGRAM_AUTH_CLIENT_ID=123456789
NUXT_APP_SECRET=at-least-32-random-characters
```

After that you can try it on a page:

```vue
<template>
  <div v-if="loggedIn">
    <p>Hey {{ user?.first_name }}, you are logged in!</p>
    <button @click="clear">Logout</button>
  </div>
  <TelegramLoginButton v-else />
</template>

<script setup lang="ts">
const { user, loggedIn, clear } = useTelegramSession();
</script>
```

See the [documentation](https://halitsever.github.io/nuxt-telegram-auth) for the redirect login, hooks, page protection, the classic login widget and upgrading from 1.x.

<p align="center" href="https://github.com/halitsever/nuxt-telegram-auth/issues">
<img src="https://halitsever-api.vercel.app/api/issue"/>
</p>

<p align="center">
<img src="https://halitsever-api.vercel.app/api/sponsor"/>
</p>

<p align="center">
<img src="https://halitsever-api.vercel.app/api/license"/>
</p>

<p align="center">
  MIT LICENSE | <a href="https://halit.org">Halit Sever</a>
</p>
