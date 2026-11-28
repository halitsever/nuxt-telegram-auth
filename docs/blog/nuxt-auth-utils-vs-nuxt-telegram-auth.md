---
title: "nuxt-auth-utils vs nuxt-telegram-auth"
titleTemplate: false
description: "nuxt-auth-utils and nuxt-telegram-auth both seal the session in a cookie. Compare providers, page protection, hooks and Telegram support before you pick one."
headline: "nuxt-auth-utils or nuxt-telegram-auth: what each module does"
date: "2026-11-28"
keyword: "nuxt auth utils"
faq:
  [
    { "q": "Does nuxt-auth-utils have a Telegram provider?", "a": "Its README lists 51 named OAuth providers and a generic OpenID Connect handler, but no Telegram provider (checked on 28 November 2026)." },
    {
      "q": "Can I install both modules in one app?",
      "a": "Yes. nuxt-telegram-auth uses its own cookie and its own composable, useTelegramSession(). When nuxt-auth-utils is installed it does not register its deprecated useUserSession() alias, so the two do not clash.",
    },
  ]
---

# nuxt-auth-utils or nuxt-telegram-auth: what each module does

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">nuxt-auth-utils (atinux/nuxt-auth-utils on GitHub) is a general-purpose auth toolbox for Nuxt. nuxt-telegram-auth does one thing: Telegram login. They share an idea, a session sealed into an HttpOnly cookie, and differ in almost everything else.</p>

## Side by side

|                        | nuxt-auth-utils                                                         | nuxt-telegram-auth                                                                                     |
| ---------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Scope                  | Sessions plus OAuth providers, password hashing and WebAuthn (passkeys) | Telegram Login (popup and redirect) and the legacy Telegram widget                                     |
| Nuxt version           | 4.6 or later                                                            | 4.6 or later                                                                                           |
| Session storage        | Sealed cookie, secret derived from `NUXT_APP_SECRET`                    | Sealed cookie, secret derived from `NUXT_APP_SECRET` or set with `NUXT_TELEGRAM_AUTH_SESSION_PASSWORD` |
| Client composable      | `useUserSession()`                                                      | `useTelegramSession()`                                                                                 |
| Server helpers         | `getUserSession`, `requireUserSession`, `setUserSession` and more       | `getTelegramSession`, `requireTelegramSession`, `clearTelegramSession`, plus two token verifiers       |
| Who writes the session | Your handler calls `setUserSession`                                     | The module, after its own checks                                                                       |
| Page protection        | You write a route middleware                                            | `definePageMeta({ telegramAuth: true })`                                                               |
| Telegram               | Not in the provider list                                                | The whole point                                                                                        |

The nuxt-auth-utils facts come from its [README](https://github.com/atinux/nuxt-auth-utils); the nuxt-telegram-auth facts from its [configuration](/configuration) and [sessions](/sessions) pages.

## What they have in common

Both modules keep the session in a cookie that is sealed (encrypted and signed) with a server secret, so there is no session table and no Redis. Both say the same thing about size: browsers drop cookies over 4096 bytes, so the session should hold an id and a few small fields, not a whole profile. Both need `NUXT_APP_SECRET` in production, at least 32 characters. Both need a running Nuxt server, since login and session reads go through server routes.

## Where nuxt-auth-utils fits

nuxt-auth-utils is a toolbox. Each OAuth provider comes as an event handler, `defineOAuth<Provider>EventHandler`, and in `onSuccess` you decide what goes into the session with `setUserSession`. It also ships `hashPassword` and `verifyPassword` (scrypt) for email and password logins, WebAuthn handlers for passkeys, and an `<AuthState>` component that shows auth state safely whatever the rendering mode. The README lists providers from Apple and Discord to Zitadel, and a generic OIDC handler for anything else.

Use it when the app needs several login methods, passwords or passkeys, or full control over what the session contains.

## Where nuxt-telegram-auth fits

nuxt-telegram-auth does the whole Telegram flow without your code in the middle:

- the button, the popup and the redirect routes are built in;
- the server verifies Telegram's `id_token` against Telegram's public keys, with `nonce`, `state` and PKCE where they apply ([how the checks work](/blog/telegram-login-verification));
- it writes the session itself, and the `telegram-auth:login` hook lets you add data or refuse the user ([saving users on login](/blog/telegram-login-save-users));
- pages are protected with one `definePageMeta` line ([page middleware](/blog/nuxt-auth-middleware)).

Use it when Telegram is the login, for example a dashboard for a bot or a site for a group chat.

## Using both

Telegram is not in nuxt-auth-utils' provider list, so an app that wants GitHub and Telegram login can run both modules. Each keeps its own cookie (`nuxt-telegram-auth` is the default name of this module's), and each has its own composable. When nuxt-auth-utils is present, nuxt-telegram-auth skips registering its 1.x `useUserSession()` alias, so the name belongs to nuxt-auth-utils.

You then have two sessions to read. If that is awkward, a `telegram-auth:login` hook can look up or create your own user record by Telegram id, and the rest of the app can work from that record.

## FAQ

### Does nuxt-auth-utils have a Telegram provider?

Its README lists 51 named OAuth providers and a generic OpenID Connect handler, but no Telegram provider (checked on 28 November 2026).

### Can I install both modules in one app?

Yes. nuxt-telegram-auth uses its own cookie and its own composable, useTelegramSession(). When nuxt-auth-utils is installed it does not register its deprecated useUserSession() alias, so the two do not clash.

## Related posts

- [Nuxt auth in 2026: the main modules compared](/blog/nuxt-authentication-options)
- [Nuxt auth middleware: protecting pages and server routes](/blog/nuxt-auth-middleware)
- [Sealed cookies or JWTs for Nuxt sessions](/blog/nuxt-sealed-cookies-vs-jwt)
- [All posts](/blog/)
