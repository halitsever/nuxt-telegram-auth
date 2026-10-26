# Page protection

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

::: warning
Page protection decides what the browser shows. Your data is only safe if the server routes behind it check the session too, with [`requireTelegramSession`](/sessions#server-utilities).
:::
