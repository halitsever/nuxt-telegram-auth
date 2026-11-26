---
description: "Protect Nuxt pages behind Telegram login with definePageMeta({ telegramAuth: true }) and its options."
---

# Page protection

The module registers a global route middleware, so any page can ask for a Telegram session with one line in `definePageMeta`. You don't add the middleware to pages yourself, and the `telegramAuth` key is typed in `PageMeta`, so your editor completes it.

Mark pages with `definePageMeta`:

```vue
<script setup lang="ts">
definePageMeta({ telegramAuth: true });
</script>
```

| Value     | Effect                                                                               |
| --------- | ------------------------------------------------------------------------------------ |
| `true`    | Visitors without a session go to the login page, with `?redirect=` set to this page. |
| `'guest'` | Logged-in visitors go to `redirectAfterLogin`. Handy for the login page itself.      |
| `false`   | No check, even with `protectAll`.                                                    |

During server rendering the redirect is a real `302`, so a protected page's HTML never reaches someone without a session.

The `?redirect=` value is the full path of the page, including its query string and hash, so the visitor comes back to exactly where they were. In the browser, the first navigation waits for the session to load before it decides, so a logged-in visitor is not sent to the login page by mistake.

## Prerendered and cached pages

HTML that is prerendered, or served from a Nitro route cache, goes to every visitor, so it can't carry one visitor's session. On those pages the server skips the check and the browser makes the decision after it loads the session. The page's HTML is public in that case. Leave protected pages out of prerendering and route caching if their markup itself should stay private.

## Options

```ts
export default defineNuxtConfig({
  telegramAuth: {
    loginPath: "/login", // default
    redirectAfterLogin: "/", // default
    protectAll: false, // default
  },
});
```

- `loginPath`: where visitors without a session are sent.
- `redirectAfterLogin`: where a login on the login page ends when there is no `?redirect=`, and where logged-in visitors of a `'guest'` page go.
- `protectAll`: with `true`, pages without `telegramAuth` count as protected. The login page is always reachable.

To protect a whole app except a few public pages, turn on `protectAll` and opt those pages out:

```vue
<!-- pages/about.vue -->
<script setup lang="ts">
definePageMeta({ telegramAuth: false });
</script>
```

## The login page

A login page needs nothing more than a button. After the login, the module follows `?redirect=` by itself:

```vue
<!-- pages/login.vue -->
<template>
  <TelegramLoginButton />
</template>

<script setup lang="ts">
definePageMeta({ telegramAuth: "guest" });
</script>
```

The module only follows a `redirect` that is a path on your own site. A full URL to another domain, or anything that doesn't start with `/`, falls back to `redirectAfterLogin`, so a crafted link can't send people elsewhere after they log in.

When a redirect login fails, the user comes back to the login page with `?telegram_error=<code>`. You can read it to show a message:

```vue
<script setup lang="ts">
const route = useRoute();
const loginError = computed(() => route.query.telegram_error);
</script>
```

The codes are listed under [Telegram Login errors](/telegram-login#errors).

::: warning
Page protection decides what the browser shows. Your data is only safe if the server routes behind it check the session too, with [`requireTelegramSession`](/sessions#server-utilities).
:::
