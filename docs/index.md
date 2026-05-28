---
layout: home

hero:
  name: "Nuxt Telegram Auth"
  text: "Telegram login, done right"
  tagline: Drop it into your Nuxt app, add your bot token, ship. That's it.
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
    title: One command to install
    details: npx nuxi module add nuxt-telegram-auth and you're basically done. Component and composable are auto-imported.

  - icon: 🔒
    title: Actually secure
    details: HMAC-SHA256 verification on the server, timing-safe hash comparison, configurable session TTL. Follows Telegram's official spec.

  - icon: 🛡️
    title: Protect routes without the config mess
    details: Just call requireTelegramSession(event) inside any server route. It's auto-imported, no setup needed.

  - icon: 🍪
    title: No database needed
    details: Sessions live in a cookie. Works on Vercel, Netlify, anywhere. No Redis, no extra setup.

  - icon: 🔧
    title: Tweak what you need
    details: Session expiry is 24h by default but you can change it in nuxt.config.ts. Pretty much the only thing you'd want to configure anyway.

  - icon: 📘
    title: TypeScript out of the box
    details: Everything is typed. Session data, composable return values, server utils. Your IDE will thank you.
---
