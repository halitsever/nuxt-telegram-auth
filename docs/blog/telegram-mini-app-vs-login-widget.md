---
title: "Telegram Mini App vs Login Widget for Web Login"
titleTemplate: false
description: "Telegram Mini Apps sign users in with initData, websites use Telegram Login or the old widget. How each works, how to verify it, what this module covers."
headline: "Telegram Mini Apps and the login widget: which one signs users in"
date: "2026-11-28"
keyword: "telegram mini app"
faq:
  [
    {
      "q": "Does nuxt-telegram-auth support Telegram Mini Apps?",
      "a": "No. Version 2.0 has no route that reads or verifies Mini App initData. It handles Telegram Login (popup and OpenID Connect redirect) and the legacy login widget.",
    },
    { "q": "Can I trust initDataUnsafe in a Mini App?", "a": "No. Telegram's documentation says data from initDataUnsafe should not be trusted. Send the raw initData string to your server and validate its hash there." },
    { "q": "Which one should a normal website use?", "a": "Telegram Login. It works in any browser, gives your server a signed id_token and is what Telegram's current login documentation describes." },
  ]
---

# Telegram Mini Apps and the login widget: which one signs users in

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">Telegram gives you two different ways to know who a user is. A Mini App runs inside Telegram and receives signed launch data. A normal website opens Telegram Login, or the older login widget, and receives a signed token. They solve different problems, and nuxt-telegram-auth only handles the second one.</p>

## Two kinds of Telegram identity

|                               | Mini App                                                                                                | Telegram Login (website)                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Where it runs                 | Inside the Telegram app, opened from a bot                                                              | Any browser, on your own domain                                 |
| What your page receives       | `initData`, a signed string with the user and launch details                                            | An `id_token`, a signed OpenID Connect JWT                      |
| How the server checks it      | HMAC-SHA-256 with a key derived from the bot token and the string `WebAppData`, or an Ed25519 signature | Telegram's public keys (JWKS), plus issuer, audience and expiry |
| Setup in BotFather            | A Mini App URL for the bot                                                                              | Login Widget, Allowed URLs, Client ID and Client Secret         |
| Handled by nuxt-telegram-auth | No                                                                                                      | Yes, as a popup or a redirect                                   |

## What a Telegram Mini App is

A Mini App is a web page that Telegram opens inside its own interface. According to Telegram's [Mini Apps documentation](https://core.telegram.org/bots/webapps), it can be launched from a keyboard button, an inline button, the bot's menu button, a direct link, the attachment menu, or as the bot's main Mini App configured in BotFather.

When it opens, Telegram's JavaScript object `Telegram.WebApp` exposes two fields about the launch:

- `initData`: the raw string Telegram passed to the app. The documentation says to validate it before using it on the bot's server.
- `initDataUnsafe`: the same data already parsed into an object. The documentation says data from this field should not be trusted.

To check `initData`, the server builds a data-check-string from all received fields except `hash`, sorted alphabetically and joined with line feeds. It computes a secret key as the HMAC-SHA-256 of the bot token with `WebAppData` as the key, then compares the HMAC-SHA-256 of the data-check-string with the received `hash`. Telegram also signs the same string with Ed25519, so a third party that only knows the bot id can verify it with Telegram's public key. Checking `auth_date` keeps old launch data from being reused.

There is no separate "log in" step. The user is already in Telegram, and the launch data says who they are.

## What Telegram Login is

A website outside Telegram has no launch data, so it has to ask. Telegram's current [Telegram Login documentation](https://core.telegram.org/widgets/login) describes Telegram Login: an OAuth 2.0 and OpenID Connect flow where Telegram returns an `id_token` signed with one of the bot's keys. The browser either opens a popup through Telegram's `telegram-login.js` library or follows a redirect to `https://oauth.telegram.org/auth` and back.

Before Telegram Login, sites used the login widget, an iframe button that passed signed user fields to a callback or a redirect URL. Its [legacy widget documentation](https://core.telegram.org/widgets/login-legacy) is now archived. Once a bot switches to Telegram Login, the old widget shows "Bot domain invalid" for that bot.

## What nuxt-telegram-auth covers

The module is built for the website case:

- `<TelegramLoginButton>` and `useTelegramLogin()` open the Telegram Login popup. The server checks the `id_token` and a one-time `nonce`.
- `/auth/telegram` starts the redirect flow with PKCE, `state` and `nonce`, and `/auth/telegram/callback` finishes it.
- `<TelegramLoginWidget>` keeps the legacy widget working for bots that have not switched.

All three end in the same sealed session cookie. Inside Telegram's own in-app browser, a Telegram Login is confirmed in the app instead of a popup, but that is still a website login, not a Mini App launch.

**Mini App `initData` is not handled.** The `TelegramProvider` type in the source lists `"miniapp"`, but no route in version 2.0 reads or verifies `initData`, and there is no server utility that writes a session from your own check. If you build a Mini App with Nuxt today, validate `initData` in your own server route as described above.

## Which one to use

- Your product lives inside Telegram, opened from a bot: build a Mini App and validate `initData` on the server.
- Your product is a normal website or dashboard and people arrive from a browser: use Telegram Login. In Nuxt, the [quickstart](/installation) gets a button working in four steps, and the [Telegram login widget generator](/telegram-login-widget/) writes the component code for you.
- You already run the legacy widget: it keeps working until the bot switches. Read [Migrating from 1.x](/migration) before you turn Telegram Login on, because the switch is one way.

## FAQ

### Does nuxt-telegram-auth support Telegram Mini Apps?

No. Version 2.0 has no route that reads or verifies Mini App initData. It handles Telegram Login (popup and OpenID Connect redirect) and the legacy login widget.

### Can I trust initDataUnsafe in a Mini App?

No. Telegram's documentation says data from initDataUnsafe should not be trusted. Send the raw initData string to your server and validate its hash there.

### Which one should a normal website use?

Telegram Login. It works in any browser, gives your server a signed id_token and is what Telegram's current login documentation describes.

## Related posts

- [Nuxt auth in 2026: the main modules compared](/blog/nuxt-authentication-options)
- [Verifying a Telegram login on the server](/blog/telegram-login-verification)
- [BotFather setup for Telegram Login: Allowed URLs and client ID](/blog/botfather-login-widget-setup)
- [All posts](/blog/)
