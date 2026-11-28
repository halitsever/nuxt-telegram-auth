---
title: "Telegram Login and Nuxt Auth Guides"
titleTemplate: false
description: "Guides to Telegram login in Nuxt and web auth: Nuxt auth modules, middleware, PKCE, JWKS, ID tokens, HttpOnly and SameSite cookies, and Telegram user IDs."
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

## [PKCE in plain terms: the verifier, the challenge and why they exist](/blog/what-is-pkce)

What PKCE is and how the code_verifier and S256 code_challenge protect the OAuth code flow, checked against RFC 7636's test vector, using Telegram Login.

## [What a JWKS is and how servers use it to verify JWTs](/blog/what-is-jwks)

What a JSON Web Key Set is, how a jwks_uri and kid let you verify a JWT, what Telegram's JWKS endpoint contains, and how to verify a token with jose in Node.js.

## [HttpOnly cookies, tested: hidden from scripts, still sent with requests](/blog/httponly-cookie)

What the HttpOnly cookie attribute does, a Chrome test of document.cookie with and without it, what it does not stop, and how a Nuxt session cookie uses it.

## [SameSite cookies in practice: what Lax, Strict and None send](/blog/samesite-cookie-lax)

What SameSite=Lax, Strict and None do, tested in Chrome with links, forms, iframes and images, and why OAuth logins break when the state cookie is Strict.

## [ID token or access token: what each one is for in OpenID Connect](/blog/id-token-vs-access-token)

How an ID token differs from an access token in OAuth 2.0 and OpenID Connect, which one proves who logged in, and why Telegram Login only needs the ID token.

## [Getting a Telegram user ID in your app, and storing it safely](/blog/telegram-user-id)

What a Telegram user ID is, how to get it from a bot update, Telegram Login or the old widget, why sub differs, and why JavaScript can store it as a Number.
