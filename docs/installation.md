# Quickstart

This module logs people in with their Telegram account. It needs Nuxt 4.6 or newer and a Telegram bot. If you don't have a bot yet, create one with [@BotFather](https://core.telegram.org/bots#how-do-i-create-a-bot).

## Step 1: Install the module

```bash
npx nuxi module add nuxt-telegram-auth
```

## Step 2: Set a session secret

Sessions are sealed with a secret. Nuxt generates one in development, but a production build needs its own:

```bash
# .env
NUXT_APP_SECRET=your-secret-of-at-least-32-characters
```

`openssl rand -base64 32` prints a good one. Without a secret the first login in production fails with a message that says so.

## Step 3: Turn on Telegram Login for your bot

Open the [@BotFather](https://t.me/BotFather) Mini App, pick your bot and go to **Bot Settings → Login Widget** (some versions call it **Web Login**). There you:

1. Add your site to **Allowed URLs**: the origin (`https://example.com`), the callback `https://example.com/auth/telegram/callback`, and every page that shows a login button.
2. Copy the **Client ID** and the **Client Secret**.

Then put them in `.env`:

```bash
NUXT_PUBLIC_TELEGRAM_AUTH_CLIENT_ID=123456789
NUXT_TELEGRAM_AUTH_CLIENT_SECRET=your_client_secret
```

The client ID is your bot's numeric id, the part of the bot token before the colon. The secret is only needed for the [redirect login](/telegram-login#redirect-login); keep it out of git.

::: warning
Once a bot uses Telegram Login, Telegram's old login widget stops working for it on every domain. If your site still uses `<TelegramLoginWidget>`, switch the bot and your code in the same deploy. See [Migrating from 1.x](/migration).
:::

## Step 4: Add a login button

```vue
<template>
  <div v-if="loggedIn">
    <p>Welcome, {{ user?.first_name }}!</p>
    <button @click="clear">Log out</button>
  </div>
  <TelegramLoginButton v-else />
</template>

<script setup lang="ts">
const { user, loggedIn, clear } = useTelegramSession();
</script>
```

Clicking the button opens Telegram's login popup. When the user confirms, the server checks the token Telegram sends back, creates the session, and `useTelegramSession()` updates. Inside Telegram's own browser the login is confirmed in the app instead of a popup.

Sessions last 24 hours by default. [Configuration](/configuration) covers that and the other options, and [Page protection](/pages) shows how to keep pages for logged-in users only.
