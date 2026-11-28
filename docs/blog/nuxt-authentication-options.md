---
title: "Nuxt Authentication Options in 2026"
titleTemplate: false
description: "An overview of Nuxt auth modules: nuxt-auth-utils, sidebase nuxt-auth, the Supabase module and nuxt-telegram-auth, with what each one handles and needs."
headline: "Nuxt auth in 2026: the main modules compared"
date: "2026-11-28"
keyword: "nuxt auth"
---

# Nuxt auth in 2026: the main modules compared

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">Nuxt has no built-in login. Authentication comes from modules, and the common ones differ in where users live, how the session is stored and which providers they support. This overview sticks to what each project's own documentation says.</p>

## The short version

| Module                                                       | Built on                               | Session                 | Good fit                                                                         |
| ------------------------------------------------------------ | -------------------------------------- | ----------------------- | -------------------------------------------------------------------------------- |
| [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) | Its own OAuth handlers                 | Sealed cookie           | Apps that want OAuth, passwords or passkeys and keep users in their own database |
| [sidebase nuxt-auth](https://auth.sidebase.io/)              | Auth.js (NextAuth) or your own backend | Depends on the provider | Teams that know Auth.js, or have an existing login API                           |
| [@nuxtjs/supabase](https://supabase.nuxtjs.org/)             | Supabase Auth                          | Cookies set by Supabase | Apps already on Supabase                                                         |
| [nuxt-telegram-auth](/)                                      | Telegram Login and the legacy widget   | Sealed cookie           | Apps whose users are on Telegram                                                 |

## nuxt-auth-utils

[nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) seals the session into a cookie with a secret derived from Nuxt's `appSecret`, so production needs `NUXT_APP_SECRET`. It requires Nuxt 4.6 or later and a running server; its README says it does not work with `nuxt generate`. It ships OAuth handlers for a long list of providers, a generic OpenID Connect handler, scrypt password hashing and WebAuthn passkeys. You write the handler that decides what goes into the session. [nuxt-auth-utils vs nuxt-telegram-auth](/blog/nuxt-auth-utils-vs-nuxt-telegram-auth) compares the two in detail.

## sidebase nuxt-auth

sidebase describes NuxtAuth as an open source module for Nuxt 3 and later. Its `authjs` provider wraps Auth.js / NextAuth.js and brings its OAuth, credentials and email magic link methods. Its `local` provider talks to a login API you already have. It includes app-side middleware for the whole app or single pages, and server-side protection for endpoints.

## @nuxtjs/supabase

The Supabase module connects Nuxt to Supabase, including Supabase Auth. With `useSsrCookies` on (the default) the session is shared between server and client through cookies. Its `redirectOptions` send visitors without a session to a `login` path, bring them back on a `callback` path and leave `exclude` paths public. Supabase Auth has a list of social providers; Telegram is not on it (checked on 28 November 2026), though it accepts custom OAuth and OIDC providers.

## nuxt-telegram-auth

This module handles one login method end to end. `<TelegramLoginButton>` opens Telegram's popup, `/auth/telegram` runs the OpenID Connect redirect, and the server verifies Telegram's `id_token` before it writes a sealed, HttpOnly cookie. There is no user database to set up. Pages are protected with `definePageMeta({ telegramAuth: true })`, server routes with `requireTelegramSession(event)`, and server hooks let you save users or refuse a login. The [quickstart](/installation) covers install and BotFather.

## How to choose

1. **Where do your users already have an account?** On Telegram, use nuxt-telegram-auth. On Supabase, use its module. On GitHub, Google and similar, nuxt-auth-utils or sidebase.
2. **Do you need passwords or passkeys?** nuxt-auth-utils has both built in.
3. **Do you have a login backend already?** sidebase's `local` provider is made for that.
4. **Do you want a database for sessions?** None of the cookie-based modules need one. [Sealed cookies vs JWT](/blog/nuxt-sealed-cookies-vs-jwt) explains the trade-off.

Modules can be combined. An app can offer Telegram login through nuxt-telegram-auth and other providers through nuxt-auth-utils, as long as you decide which session is the source of truth.

## Related posts

- [Telegram Mini Apps and the login widget: which one signs users in](/blog/telegram-mini-app-vs-login-widget)
- [nuxt-auth-utils or nuxt-telegram-auth: what each module does](/blog/nuxt-auth-utils-vs-nuxt-telegram-auth)
- [Sealed cookies or JWTs for Nuxt sessions](/blog/nuxt-sealed-cookies-vs-jwt)
- [All posts](/blog/)
