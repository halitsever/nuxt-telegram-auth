<p align="center" class="logo-section">
<img src="https://i.ibb.co/MMcBdPN/nuxt-telegram-auth.png" height="80" width="80"/>
</br>
<img src="https://halitsever-api.vercel.app/api/repo-title?title=Nuxt%20Telegram%20Auth">

<p align="center">
🔐 A Telegram login widget integration for Nuxt
<br>
<br/>
<br/>
<img src="https://img.shields.io/github/sponsors/halitsever"/>
</p>
<p align="center">
<a align="center" href="https://halitsever.github.io/nuxt-telegram-auth">Documentation</a>
  </p>
</p>

<p align="center">
<img src="https://halitsever-api.vercel.app/api/details"/>
</p>

- 😌 [**Easy Integration**](#) - A Telegram bot and this module are all you need for the login widget
- 🔒 [**Secure Sessions**](#) - The server checks Telegram's signature as described in the <a href="https://core.telegram.org/widgets/login-legacy">official docs</a> and keeps the login in an HttpOnly cookie
- 🔁 [**Redirect Mode**](#) - Logins can also come back through a redirect, handled by `/api/telegram/callback`
- 🛡️ [**Server Utilities**](#) - `requireTelegramSession(event)` protects your own API routes
  <p align="center" >
  <img src="https://halitsever-api.vercel.app/api/installation"/>
  </p>

Installation:

```bash
npx nuxi module add nuxt-telegram-auth
```

Then add your bot token to `.env`:

```bash
NUXT_TELEGRAM_AUTH_BOT_TOKEN=123456:your_bot_token
```

Your site's domain also has to be set for the bot in [@BotFather](https://t.me/BotFather) with `/setdomain`.

After that you can try it on a page:

```vue
<template>
  <div v-if="session.loggedIn">
    <p>Hey {{ session.first_name }}, you are logged in!</p>
    <button @click="clearSession">Logout</button>
  </div>
  <TelegramLoginWidget v-else telegram-login="my_bot" @callback="onLogin" />
</template>

<script setup>
const { session, clearSession } = useUserSession();
const onLogin = (user) => console.log("Logged in as", user.username);
</script>
```

See the [documentation](https://halitsever.github.io/nuxt-telegram-auth) for redirect mode, server utilities and every option.

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
