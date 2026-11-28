---
layout: home
title: "Nuxt Telegram Auth: Telegram login widget and OAuth for Nuxt"
titleTemplate: false
description: "Nuxt auth module for Telegram login: the Telegram login widget or button, or the OAuth (OpenID Connect) redirect, with the session sealed on the server."

hero:
  name: "Nuxt Telegram Auth"
  text: "Telegram login for Nuxt"
  tagline: Telegram's login widget and OAuth redirect in your Nuxt app, with the session checked and sealed on the server.
  actions:
    - theme: brand
      text: Get Started
      link: /installation
    - theme: alt
      text: View on GitHub
      link: https://github.com/halitsever/nuxt-telegram-auth
  image:
    src: /telegram-logo.png
    alt: Nuxt Telegram Auth

features:
  - icon: ⚡
    title: Popup or redirect
    details: "Drop in the TelegramLoginButton component for Telegram's popup, or send people through the OpenID Connect redirect. Inside Telegram's own browser the login is confirmed in the app."

  - icon: 🔒
    title: Checked on the server
    details: Telegram's id_token is verified against its public keys, with PKCE, state and nonce. The browser's copy of the user is never trusted.

  - icon: 🍪
    title: No database needed
    details: Sessions live in a sealed, HttpOnly cookie, so there is no database or Redis to set up.

  - icon: 🛡️
    title: Pages and routes
    details: "definePageMeta({ telegramAuth: true }) guards pages, requireTelegramSession(event) guards server routes."

  - icon: 🪝
    title: Hooks
    details: Save users to your database, add a role to the session or refuse a login from a server hook.

  - icon: 🔁
    title: Old widget still works
    details: Bots that haven't switched to Telegram Login keep the classic widget, and 1.x sessions carry over.
---

## What it does

nuxt-telegram-auth adds "Log in with Telegram" to a Nuxt app. People sign in with the Telegram account they already have, so there are no passwords to store and no email to confirm. The module handles the whole flow: it shows Telegram's login button or sends the browser to Telegram, checks the answer on your server and keeps the user logged in with a cookie.

It suits apps whose users are already on Telegram, such as a dashboard for a bot, a community site or a tool for a group chat, and any Nuxt project that wants a login without running its own user database.

## How a login works

1. The visitor clicks `<TelegramLoginButton>` and confirms in Telegram's popup, or follows a link to `/auth/telegram` for the redirect flow.
2. Telegram returns an `id_token`. Your server checks it against Telegram's public keys and against the one-time values the module created for that login: a `nonce` for both flows, plus `state` and PKCE for the redirect.
3. The module runs your `telegram-auth:login` hook, if you registered one, and writes the session into a sealed, HttpOnly cookie.
4. `useTelegramSession()` in your components and `requireTelegramSession(event)` in your server routes read that session.

The browser never decides who is logged in. Only data that passed the server checks ends up in the session.

## Requirements

- Nuxt 4.6 or newer.
- Node.js 22.22.3 or a later 22.x, 24.15.0 or a later 24.x, or 26 and newer.
- A Telegram bot with Telegram Login turned on in BotFather, and your site listed in its Allowed URLs.
- A session secret of at least 32 characters in production.

## Start here

- [Quickstart](/installation): install the module, set the secret and add a button.
- [Telegram Login](/telegram-login): the popup and redirect flows and their error codes.
- [Sessions and hooks](/sessions): read the session and react to logins on the server.
- [Page protection](/pages): keep pages for logged-in users only.
- [Migrating from 1.x](/migration): move an existing app and its users to 2.0.
- [Telegram login widget generator](/telegram-login-widget/): pick the button options and copy the code.
- [Blog](/blog/): guides to Telegram Mini Apps, Nuxt auth modules, middleware, sessions and BotFather.
