---
layout: home

hero:
  name: "Nuxt Telegram Auth"
  text: "Log in with Telegram"
  tagline: Telegram Login for Nuxt, with the session checked and sealed on the server.
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
