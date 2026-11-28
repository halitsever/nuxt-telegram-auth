---
title: "Sealed Session Cookies vs JWT in Nuxt"
titleTemplate: false
description: "Why nuxt-telegram-auth keeps sessions in one sealed HttpOnly cookie instead of a JWT in the browser, and where a JWT still appears in the Telegram login flow."
headline: "Sealed cookies or JWTs for Nuxt sessions"
date: "2026-11-28"
keyword: "nuxt 3 jwt authentication"
faq:
  [
    { "q": "Is the sealed cookie readable by JavaScript on the page?", "a": "No. The module sets it HttpOnly, so page scripts cannot read it. It is also Secure and SameSite=Lax by default." },
    { "q": "Does the module keep Telegram's id_token?", "a": "No. The id_token is checked once on the server and thrown away. The cookie holds only the session the module built from it." },
  ]
---

# Sealed cookies or JWTs for Nuxt sessions

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">Searches for Nuxt JWT authentication usually mean one question: where should the logged-in state live? A JWT is a signed token the client holds. A sealed cookie is encrypted data only the server can open. nuxt-telegram-auth receives a JWT from Telegram and stores a sealed cookie.</p>

## Two ways to hold a session

|                          | JWT held by the client                                                                               | Sealed session cookie                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Format                   | Header, claims and signature, base64url encoded ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)) | Encrypted and signed blob                                |
| Who can read the content | Anyone who has the token; a signed JWT is not encrypted                                              | Only the server with the secret                          |
| Where it usually sits    | `localStorage` or an `Authorization` header, sometimes a cookie                                      | An HttpOnly cookie                                       |
| Ending a session early   | Hard: the token is valid until `exp` unless you keep a block list                                    | Clear the cookie; changing the secret ends every session |
| Server state needed      | None for checking, a store for revocation                                                            | None                                                     |

Both avoid a session table. The difference is who can see the contents and how the browser carries them.

## Where JWTs show up in Telegram login

Telegram Login is an OpenID Connect flow, so Telegram does hand out a JWT: the `id_token`. The module verifies it on the server with [jose](https://github.com/panva/jose) against Telegram's public keys, checks issuer, audience (your bot's client id), `exp`, `iat` and the `nonce` it issued, and accepts only RS256 and ES256 signatures. The details are in [how Telegram login verification works](/blog/telegram-login-verification).

After that, the token has done its job. The module builds a session object (user id, names, username, photo, the provider and the login time) and seals it into a cookie. The `id_token` is never stored.

## Why one sealed cookie

From the [sessions docs](/sessions) and the source:

- **HttpOnly.** Page scripts cannot read the session, so an injected script cannot copy it the way it could copy a token from `localStorage`.
- **Secure and SameSite=Lax.** The browser sends it only over HTTPS and not on cross-site subrequests.
- **No database.** The session travels with the request, so there is no Redis or session table to run.
- **One shape for every login method.** The popup, the redirect and the legacy widget all end in the same cookie.
- **A fixed lifetime.** `session.maxAge` (24 hours by default) counts from the login, however often the session is read.
- **Logging everyone out is one change.** Rotating `NUXT_APP_SECRET`, or `NUXT_TELEGRAM_AUTH_SESSION_PASSWORD` if you set it, makes every existing cookie unreadable.

The secret must be at least 32 characters. Nuxt generates one in development, but a production build needs its own; `openssl rand -base64 32` prints a good one.

## The limits of a cookie session

- **Size.** Browsers drop cookies over 4096 bytes. Keep `session.data` to an id and a role. The module warns in development when the cookie gets close.
- **No per-session revocation.** Without a server store you cannot end one user's session early, other than by refusing them in a `telegram-auth:session` hook or rotating the secret for everyone.
- **Same-site API calls.** The cookie suits a Nuxt app calling its own server routes. A separate mobile client or a third-party API that expects a bearer token needs something else.

## When a JWT is the better choice

If several services on different domains must accept the same login, or a native app talks to your API, a short-lived signed token sent in an `Authorization` header is the usual answer. Nothing in nuxt-telegram-auth stops you: in a server route you can read the session with `requireTelegramSession(event)` and issue your own token for those clients. For a Nuxt site talking to its own server, the sealed cookie is less to get wrong.

## FAQ

### Is the sealed cookie readable by JavaScript on the page?

No. The module sets it HttpOnly, so page scripts cannot read it. It is also Secure and SameSite=Lax by default.

### Does the module keep Telegram's id_token?

No. The id_token is checked once on the server and thrown away. The cookie holds only the session the module built from it.

## Related posts

- [nuxt-auth-utils or nuxt-telegram-auth: what each module does](/blog/nuxt-auth-utils-vs-nuxt-telegram-auth)
- [Nuxt auth middleware: protecting pages and server routes](/blog/nuxt-auth-middleware)
- [Verifying a Telegram login on the server](/blog/telegram-login-verification)
- [HttpOnly cookies, tested: hidden from scripts, still sent with requests](/blog/httponly-cookie)
- [ID token or access token: what each one is for in OpenID Connect](/blog/id-token-vs-access-token)
- [All posts](/blog/)
