---
title: "Protect Nuxt Pages With Auth Middleware"
titleTemplate: false
description: "How Nuxt route middleware protects pages, why server routes need their own check, and how nuxt-telegram-auth does both with definePageMeta and one helper."
headline: "Nuxt auth middleware: protecting pages and server routes"
date: "2026-11-28"
keyword: "nuxt auth middleware"
faq:
  [
    {
      "q": "Does Nuxt route middleware run on the server?",
      "a": "Yes, for the first page. Nuxt's documentation says that on a server-rendered or generated site, middleware for the initial page runs when the page is rendered and again on the client.",
    },
    {
      "q": "Is page middleware enough to protect an API?",
      "a": "No. Route middleware only guards page navigation. Each server route that returns private data needs its own session check, such as requireTelegramSession(event).",
    },
  ]
---

# Nuxt auth middleware: protecting pages and server routes

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">In Nuxt, an auth middleware is a route middleware: a function that runs before a page renders and can send the visitor somewhere else. It decides what the browser shows. Your data needs a second check on the server.</p>

## Route middleware in Nuxt

Nuxt's [middleware documentation](https://nuxt.com/docs/4.x/directory-structure/app/middleware) names three kinds:

- **Anonymous** middleware, written inline in a page's `definePageMeta`.
- **Named** middleware, a file in `app/middleware/` that a page asks for with `definePageMeta({ middleware: 'auth' })`.
- **Global** middleware, a file with a `.global` suffix that runs on every route change.

A middleware returns nothing to let the navigation through, `navigateTo()` to redirect, or `abortNavigation()` to stop it. On a server-rendered site the middleware for the first page runs during rendering and again in the browser.

A hand-written auth middleware usually looks like this:

```ts
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useSomeSession();
  if (!loggedIn.value) return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
});
```

## The same thing with nuxt-telegram-auth

The module registers a global middleware of its own, so a page only declares what it needs:

```vue
<script setup lang="ts">
definePageMeta({ telegramAuth: true });
</script>
```

| Value     | What happens                                                                     |
| --------- | -------------------------------------------------------------------------------- |
| `true`    | Visitors without a session go to `loginPath` with `?redirect=` set to this page. |
| `'guest'` | Logged-in visitors go to `redirectAfterLogin`. Use it on the login page.         |
| `false`   | No check, even with `protectAll`.                                                |

`telegramAuth` is typed in `PageMeta`, so the editor completes it. With `protectAll: true` in `nuxt.config`, every page counts as protected unless it opts out, and the login page is always reachable. The [page protection docs](/pages) list every option.

A few details from the source that a hand-written version often misses:

- During server rendering the redirect is a real `302`, so the protected HTML never reaches a visitor without a session.
- In the browser, the first navigation waits for the session to load before it decides, so a logged-in visitor is not bounced to the login page.
- On prerendered or route-cached pages the server skips the check, because that HTML is shared by everyone, and the browser decides instead. The markup of such a page is public.
- `?redirect=` is only followed when it is a path on your own site. A full URL to another domain falls back to `redirectAfterLogin`.

## The check that actually protects data

Route middleware runs in the browser as well as the server, and the browser is under the visitor's control. It is there for the interface. Anything private your API returns needs a check in the server route itself:

```ts
// server/api/dashboard.get.ts
export default defineEventHandler(async (event) => {
  const { user } = await requireTelegramSession(event);
  return { greeting: `Hello, ${user.first_name}` };
});
```

`requireTelegramSession(event)` answers `401` without a session. `getTelegramSession(event)` returns `null` instead, for routes that work for both guests and users. Both read the sealed cookie on the server, where the visitor cannot change it. See [sessions and hooks](/sessions) for the rest of the server utilities.

## A minimal protected app

```vue
<!-- pages/login.vue -->
<template>
  <TelegramLoginButton />
</template>

<script setup lang="ts">
definePageMeta({ telegramAuth: "guest" });
</script>
```

```vue
<!-- pages/dashboard.vue -->
<script setup lang="ts">
definePageMeta({ telegramAuth: true });
const { data } = await useFetch("/api/dashboard");
</script>
```

The login page needs no code to handle `?redirect=`: after a login there the module follows it by itself. The [Telegram login widget generator](/telegram-login-widget/) writes the button code with the options you pick.

## FAQ

### Does Nuxt route middleware run on the server?

Yes, for the first page. Nuxt's documentation says that on a server-rendered or generated site, middleware for the initial page runs when the page is rendered and again on the client.

### Is page middleware enough to protect an API?

No. Route middleware only guards page navigation. Each server route that returns private data needs its own session check, such as requireTelegramSession(event).

## Related posts

- [Nuxt auth in 2026: the main modules compared](/blog/nuxt-authentication-options)
- [Sealed cookies or JWTs for Nuxt sessions](/blog/nuxt-sealed-cookies-vs-jwt)
- [Saving Telegram users to a database when they log in](/blog/telegram-login-save-users)
- [All posts](/blog/)
