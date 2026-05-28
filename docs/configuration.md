# Configuration

Module options are set under the `telegramAuth` key in `nuxt.config.ts`.

```ts
export default defineNuxtConfig({
  telegramAuth: {
    sessionMaxAge: 60 * 60 * 24, // 24 hours (default)
  },
})
```

## Options

### `sessionMaxAge`

- **Type:** `number`
- **Default:** `86400` (24 hours)
- **Unit:** seconds

How long a Telegram session stays valid after `auth_date`. Once this window passes, the server returns `401` and the user must log in again.

```ts
telegramAuth: {
  sessionMaxAge: 60 * 60 * 24 * 7, // 7 days
}
```

---

## Protecting Server Routes

The module auto-imports two server utilities you can use directly inside your server routes:

### `requireTelegramSession(event)`

Validates the session and returns it. Throws a `401` if the session is missing or invalid — no manual checks needed.

```ts
// server/api/dashboard.get.ts
export default defineEventHandler(async (event) => {
  const session = await requireTelegramSession(event)
  // session is typed as ITelegramSession
  return { user: session.first_name }
})
```

### `getTelegramSession(event)`

Like `requireTelegramSession`, but returns `null` instead of throwing when there's no valid session. Useful when auth is optional.

```ts
// server/api/profile.get.ts
export default defineEventHandler(async (event) => {
  const session = await getTelegramSession(event)
  if (!session) return { guest: true }
  return { user: session.first_name }
})
```

Both utilities are auto-imported — no need to import them manually in your server routes.
