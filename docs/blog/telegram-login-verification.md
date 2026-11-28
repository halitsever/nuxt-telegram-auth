---
title: "How Telegram Login Verification Works"
titleTemplate: false
description: "How a Telegram login is checked on the server: id_token, JWKS, nonce, state and PKCE for Telegram OAuth, and the HMAC hash check for the legacy login widget."
headline: "Verifying a Telegram login on the server"
date: "2026-11-28"
keyword: "oauth telegram"
---

# Verifying a Telegram login on the server

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">A Telegram login is only as good as the server-side check behind it. The browser can be edited, so every piece of user data has to arrive signed by Telegram and be verified before it becomes a session. Here is what Telegram documents and what nuxt-telegram-auth checks for each login method.</p>

## Telegram Login: OAuth and OpenID Connect

Telegram's [Telegram Login documentation](https://core.telegram.org/widgets/login) describes Telegram Login as an OpenID Connect provider at `https://oauth.telegram.org`, with these endpoints:

| Endpoint           | URL                                                           |
| ------------------ | ------------------------------------------------------------- |
| Discovery          | `https://oauth.telegram.org/.well-known/openid-configuration` |
| Authorization      | `https://oauth.telegram.org/auth`                             |
| Token              | `https://oauth.telegram.org/token`                            |
| Public keys (JWKS) | `https://oauth.telegram.org/.well-known/jwks.json`            |

Either way you start it, the result is an `id_token`: a JWT signed by Telegram. Telegram's documentation says to verify the signature with the JWKS keys and check that `iss` is `https://oauth.telegram.org`, that `aud` is your bot's id and that `exp` has not passed.

nuxt-telegram-auth does those checks with the jose library and adds a few of its own:

1. **Signature algorithm.** Only RS256 and ES256 are accepted. BotFather also offers EdDSA and ES256K, but Telegram limits those to the `openid` scope, which leaves out the numeric user id; the module refuses them with `unsupported_algorithm`.
2. **Required claims.** `exp` and `iat` must be present, because a token without them would never expire. A 30-second clock tolerance covers a server clock that is slightly off.
3. **Nonce.** Before a login the server issues a random nonce in a sealed cookie that lives five minutes. The `id_token` must carry the same value, so a token captured from another login cannot be replayed.
4. **User id.** The numeric Telegram id comes from the `id` claim of the `profile` scope. `sub` is opaque and different for every bot, so the module always asks for `profile`.

### The popup flow

`<TelegramLoginButton>` asks `POST /api/telegram/nonce` for a nonce, opens Telegram's popup through `telegram-login.js`, and posts the returned `id_token` to `POST /api/telegram/sdk`. The server verifies it as above and writes the session.

### The redirect flow

`GET /auth/telegram` sends the browser to Telegram's authorization endpoint with a `state`, a `nonce` and a PKCE challenge (S256), all kept in a sealed cookie for ten minutes. On the way back, `/auth/telegram/callback` checks `state`, exchanges the code at the token endpoint with the client secret and the PKCE verifier, and verifies the `id_token`. A redirect that returns to a browser that did not start it fails with `invalid_state`.

## The legacy login widget: an HMAC check

The old widget does not use OAuth. Telegram's [legacy widget documentation](https://core.telegram.org/widgets/login-legacy) says it sends `id`, `first_name`, `last_name`, `username`, `photo_url`, `auth_date` and `hash`, and that the site checks them like this:

1. Build the data-check-string: every received field except `hash`, as `key=value`, sorted alphabetically and joined with a line feed.
2. Take the SHA-256 of the bot token as the secret key.
3. Compute the HMAC-SHA-256 of the data-check-string with that key, in hex.
4. Compare it with `hash`.

The module does exactly this with the Web Crypto API, and also rejects any login whose `auth_date` is older than `session.maxAge`. Telegram only says you "can additionally check" `auth_date`; without that check a signed login would stay valid forever. If you need the check in your own route, `verifyTelegramWidgetPayload(payload)` returns the user or `null`.

The widget's redirect mode has no `state`, so the callback cannot tell whether the login started on your site. The [redirect mode page](/redirect-mode) explains the risk; the callback mode and Telegram Login do not have it.

## What the server never trusts

- User fields sent by the browser without a signature.
- A `redirect` that is not a path on your own site.
- Login requests that are not JSON from your own origin: the login routes refuse them.

Only data that passed these checks reaches the `telegram-auth:login` hook and the session. The [Telegram Login page](/telegram-login) lists the error code for each failed check.

## Related posts

- [Telegram Mini Apps and the login widget: which one signs users in](/blog/telegram-mini-app-vs-login-widget)
- [Sealed cookies or JWTs for Nuxt sessions](/blog/nuxt-sealed-cookies-vs-jwt)
- [BotFather setup for Telegram Login: Allowed URLs and client ID](/blog/botfather-login-widget-setup)
- [All posts](/blog/)
