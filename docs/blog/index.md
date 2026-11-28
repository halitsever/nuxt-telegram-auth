---
title: "Telegram Login and Nuxt Auth Guides"
titleTemplate: false
description: "Guides to Telegram login in Nuxt: Mini Apps vs the login widget, Nuxt auth modules, page middleware, sealed cookies vs JWT, verification and BotFather."
---

# Nuxt and Telegram login guides

<p class="lead">Practical notes on logging people in with Telegram from a Nuxt app, and on Nuxt authentication in general. Every post is checked against Telegram's and Nuxt's own documentation and against the source of nuxt-telegram-auth 2.0.</p>

## [Telegram Mini Apps and the login widget: which one signs users in](/blog/telegram-mini-app-vs-login-widget)

Telegram Mini Apps sign users in with initData, websites use Telegram Login or the old widget. How each works, how to verify it, what this module covers.

## [nuxt-auth-utils or nuxt-telegram-auth: what each module does](/blog/nuxt-auth-utils-vs-nuxt-telegram-auth)

nuxt-auth-utils and nuxt-telegram-auth both seal the session in a cookie. Compare providers, page protection, hooks and Telegram support before you pick one.

## [Nuxt auth in 2026: the main modules compared](/blog/nuxt-authentication-options)

An overview of Nuxt auth modules: nuxt-auth-utils, sidebase nuxt-auth, the Supabase module and nuxt-telegram-auth, with what each one handles and needs.

## [Nuxt auth middleware: protecting pages and server routes](/blog/nuxt-auth-middleware)

How Nuxt route middleware protects pages, why server routes need their own check, and how nuxt-telegram-auth does both with definePageMeta and one helper.

## [Sealed cookies or JWTs for Nuxt sessions](/blog/nuxt-sealed-cookies-vs-jwt)

Why nuxt-telegram-auth keeps sessions in one sealed HttpOnly cookie instead of a JWT in the browser, and where a JWT still appears in the Telegram login flow.

## [Verifying a Telegram login on the server](/blog/telegram-login-verification)

How a Telegram login is checked on the server: id_token, JWKS, nonce, state and PKCE for Telegram OAuth, and the HMAC hash check for the legacy login widget.

## [Saving Telegram users to a database when they log in](/blog/telegram-login-save-users)

Use nuxt-telegram-auth's server hooks to save Telegram users to your database, add a role to the session or refuse a login, with what each hook receives.

## [BotFather setup for Telegram Login: Allowed URLs and client ID](/blog/botfather-login-widget-setup)

Step by step BotFather setup for Telegram Login: create the bot, open Login Widget, add Allowed URLs, copy the Client ID and Secret, and pick a signing key.
