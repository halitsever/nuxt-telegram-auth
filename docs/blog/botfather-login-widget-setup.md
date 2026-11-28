---
title: "Set Up Telegram Login in BotFather"
titleTemplate: false
description: "Step by step BotFather setup for Telegram Login: create the bot, open Login Widget, add Allowed URLs, copy the Client ID and Secret, and pick a signing key."
headline: "BotFather setup for Telegram Login: Allowed URLs and client ID"
date: "2026-11-28"
keyword: "botfather login widget"
faq:
  [
    {
      "q": "Is the Client ID the same as the bot token?",
      "a": "No. The Client ID is the bot's numeric id, the part of the bot token before the colon. The token itself is a secret and is only needed for the legacy widget.",
    },
    {
      "q": "Can I turn Telegram Login off again?",
      "a": "BotFather has no obvious setting for it, so plan the switch as one way. Once it is on, the legacy widget shows a 'Bot domain invalid' error for that bot on every domain.",
    },
    { "q": "How do I test on localhost?", "a": "Telegram only accepts URLs on the Allowed URLs list. Use an HTTPS tunnel such as `cloudflared tunnel --url http://localhost:3000` and add its address." },
  ]
---

# BotFather setup for Telegram Login: Allowed URLs and client ID

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">Telegram Login is switched on per bot, in BotFather. Until the bot has your site in its Allowed URLs and you have its Client ID, no login button will work. This is the whole setup, in the order you need it.</p>

## 1. Create the bot

If you do not have a bot yet, open [@BotFather](https://t.me/BotFather) and send `/newbot`. Telegram's [BotFather documentation](https://core.telegram.org/bots/features#botfather) says it asks for a name and a username, then generates the bot's token. The username must end in `bot`, is 5 to 32 characters long, and cannot be changed later. Telegram recommends that the bot's name and picture match your site, because users see them on the login screen.

The token looks like `110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw`. Keep it secret: anyone with it controls the bot. If it leaks, `/token` generates a new one.

## 2. Open Login Widget in the BotFather Mini App

BotFather also has a Mini App with the same functions in a newer interface. Open it, pick your bot and go to **Bot Settings → Login Widget**. Some versions call the section **Web Login**.

## 3. Add Allowed URLs

Telegram only processes logins and redirects for URLs registered here. Add:

- your site's origin, for example `https://example.com`, which covers popup logins on every page;
- the redirect callback, `https://example.com/auth/telegram/callback`, if you use the redirect login.

With nuxt-telegram-auth the callback path is fixed at `/auth/telegram/callback`. Behind a proxy, set `NUXT_TELEGRAM_AUTH_REDIRECT_URL` to the full public callback URL if the one built from the request is wrong.

## 4. Copy the Client ID and Client Secret

The same section shows both. Put them in `.env`:

```bash
NUXT_PUBLIC_TELEGRAM_AUTH_CLIENT_ID=123456789
NUXT_TELEGRAM_AUTH_CLIENT_SECRET=your_client_secret
NUXT_APP_SECRET=at-least-32-random-characters
```

The Client ID is public: it ends up in the page. The Client Secret is only needed for the redirect login and must stay out of git. `NUXT_APP_SECRET` seals the session cookie and is required in production.

## 5. Check the signing algorithm

Under **Login Widget → Advanced**, Telegram lets you pick how the `id_token` is signed: RS256 (the default), ES256, EdDSA or ES256K. EdDSA and ES256K are limited to the `openid` scope and drop the profile data, including the numeric user id. nuxt-telegram-auth needs that id, so leave the bot on RS256 or ES256; otherwise logins fail with `unsupported_algorithm`.

## 6. Add the button

```vue
<template>
  <TelegramLoginButton />
</template>
```

The [Telegram login widget generator](/telegram-login-widget/) writes the component and `nuxt.config` code for the options you choose, and the [quickstart](/installation) shows the full first page.

## If you still use the legacy widget

The old widget is set up differently: it needs the bot token in `NUXT_TELEGRAM_AUTH_BOT_TOKEN` and your domain set with `/setdomain` in BotFather. Turning on Telegram Login for the bot breaks it on every domain, with "Bot domain invalid". Switch the bot and your code in the same deploy, as the [migration guide](/migration) describes, and keep the [legacy widget options](/properties) handy until then.

## Common errors after setup

| Symptom                                          | Likely cause                                                   |
| ------------------------------------------------ | -------------------------------------------------------------- |
| Button reports `not_configured`                  | `NUXT_PUBLIC_TELEGRAM_AUTH_CLIENT_ID` is missing               |
| `/auth/telegram` answers 500 with a message      | `NUXT_TELEGRAM_AUTH_CLIENT_SECRET` is missing                  |
| `unsupported_algorithm`                          | The bot signs with EdDSA or ES256K                             |
| Telegram refuses the login                       | The page's origin, or the callback URL, is not in Allowed URLs |
| The popup cannot hand the login back to the page | The site sends `Cross-Origin-Opener-Policy: same-origin`       |

The COOP case is covered on the [Telegram Login page](/telegram-login#pages-with-nuxt-security), including the nuxt-security setting that fixes it.

## FAQ

### Is the Client ID the same as the bot token?

No. The Client ID is the bot's numeric id, the part of the bot token before the colon. The token itself is a secret and is only needed for the legacy widget.

### Can I turn Telegram Login off again?

BotFather has no obvious setting for it, so plan the switch as one way. Once it is on, the legacy widget shows a 'Bot domain invalid' error for that bot on every domain.

### How do I test on localhost?

Telegram only accepts URLs on the Allowed URLs list. Use an HTTPS tunnel such as `cloudflared tunnel --url http://localhost:3000` and add its address.

## Related posts

- [Telegram Mini Apps and the login widget: which one signs users in](/blog/telegram-mini-app-vs-login-widget)
- [Verifying a Telegram login on the server](/blog/telegram-login-verification)
- [Saving Telegram users to a database when they log in](/blog/telegram-login-save-users)
- [All posts](/blog/)
