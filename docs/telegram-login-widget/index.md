---
title: "Telegram Login Widget for Nuxt: Code Generator"
titleTemplate: false
description: "Generate Telegram login widget code for Nuxt: pick mode, button style, scopes or the legacy widget's size and radius, then copy the component, config and .env."
outline: [2, 2]
faq:
  - q: "Is this the official Telegram login widget?"
    a: "The button uses Telegram's own telegram-login.js library and styles, and the legacy component renders Telegram's original widget script. The generator and the Nuxt module are an open source project, not made by Telegram."
  - q: "Which component should I pick?"
    a: "TelegramLoginButton, for any bot that is new or already uses Telegram Login. TelegramLoginWidget only works for bots that have not turned on Telegram Login in BotFather."
  - q: "Does the login widget work without a server?"
    a: "No. The module verifies every login on your Nuxt server before it writes the session cookie, so it needs a running server, not a static export."
  - q: "Can I change the button text?"
    a: "Yes. TelegramLoginButton shows Log in with Telegram by default. Put your own text in its default slot."
---

<script setup>
import LoginWidgetGenerator from "../.vitepress/components/LoginWidgetGenerator.vue";
</script>

# Telegram login widget generator for Nuxt

Pick the options for your Telegram login button and copy the code for a Nuxt app that uses [nuxt-telegram-auth](/). The generator writes the component, the `nuxt.config.ts` block and the `.env` lines. It runs in your browser and does not load Telegram's script or contact Telegram.

<LoginWidgetGenerator />

## Two components, two kinds of bot

Telegram has two login widgets, and a bot can only use one of them:

|                 | `<TelegramLoginButton>`                                                                         | `<TelegramLoginWidget>`                                 |
| --------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Telegram's name | Telegram Login (OAuth and OpenID Connect)                                                       | The login widget, now documented as legacy              |
| Bot setup       | BotFather Login Widget, Allowed URLs, Client ID                                                 | `/setdomain` in BotFather, bot token                    |
| Login styles    | Popup or redirect                                                                               | Callback or redirect                                    |
| Looks           | `square`, `outlined`, `icon`, `shine`, combinable                                               | `large`, `medium` or `small`, corner radius, user photo |
| Server check    | `id_token` against Telegram's public keys, with nonce, state and PKCE                           | HMAC-SHA-256 of the login data with the bot token       |
| Env vars        | `NUXT_PUBLIC_TELEGRAM_AUTH_CLIENT_ID`, plus `NUXT_TELEGRAM_AUTH_CLIENT_SECRET` for the redirect | `NUXT_TELEGRAM_AUTH_BOT_TOKEN`                          |

Once a bot turns on Telegram Login, Telegram shows "Bot domain invalid" in the legacy widget on every domain. New projects should use the button. Existing ones can follow [Migrating from 1.x](/migration) and switch the bot and the code in one deploy.

Both components end in the same sealed, HttpOnly session cookie, read with `useTelegramSession()` in components and `requireTelegramSession(event)` in server routes.

## Set up the bot in BotFather

1. Create a bot with `/newbot` in [@BotFather](https://t.me/BotFather) if you don't have one.
2. In the BotFather Mini App, pick the bot and open **Bot Settings → Login Widget**.
3. Add your site's origin to **Allowed URLs**, for example `https://example.com`. For the redirect login also add `https://example.com/auth/telegram/callback`.
4. Copy the **Client ID** into `NUXT_PUBLIC_TELEGRAM_AUTH_CLIENT_ID`, and the **Client Secret** into `NUXT_TELEGRAM_AUTH_CLIENT_SECRET` if you use the redirect.
5. Leave the signing algorithm under **Advanced** on RS256 or ES256. EdDSA and ES256K tokens carry no user id, and the module refuses them.

The [BotFather setup guide](/blog/botfather-login-widget-setup) goes through each step and the errors you may see.

## Install the module

```bash
npx nuxi module add nuxt-telegram-auth
```

Then paste the generated code. In development, test through an HTTPS tunnel such as `cloudflared tunnel --url http://localhost:3000` and add its address to Allowed URLs, because Telegram only answers registered URLs.

## What each option does

- **Login mode.** Popup keeps the visitor on the page while Telegram's window is open. Redirect sends the browser to Telegram and back to `/auth/telegram/callback`, with no JavaScript SDK, and needs the client secret.
- **Button style.** Telegram's own looks, applied through the button's `data-style`. Two or more can be combined.
- **Extra permissions.** Profile data is always requested because the numeric user id comes with it. `write` lets your bot message the user, `phone` adds the phone number after the user agrees.
- **Redirect after login.** Must be a path on your site. Without it, a popup login on the login page follows `?redirect=`, and elsewhere the visitor stays on the page.
- **Legacy size, radius and photo.** Passed to Telegram's widget script as `data-size`, `data-radius` and `data-userpic`.

Every prop and option is listed on the [Telegram Login](/telegram-login) and [legacy widget options](/properties) pages, and [how verification works](/blog/telegram-login-verification) explains the server checks.

## FAQ

### Is this the official Telegram login widget?

The button uses Telegram's own telegram-login.js library and styles, and the legacy component renders Telegram's original widget script. The generator and the Nuxt module are an open source project, not made by Telegram.

### Which component should I pick?

`TelegramLoginButton`, for any bot that is new or already uses Telegram Login. `TelegramLoginWidget` only works for bots that have not turned on Telegram Login in BotFather.

### Does the login widget work without a server?

No. The module verifies every login on your Nuxt server before it writes the session cookie, so it needs a running server, not a static export.

### Can I change the button text?

Yes. `TelegramLoginButton` shows "Log in with Telegram" by default. Put your own text in its default slot.
