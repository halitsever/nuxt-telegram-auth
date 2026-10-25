# Configuration

## Bot token

The module reads the bot token from runtime config, so each environment can use its own token without a rebuild:

```bash
# .env
NUXT_TELEGRAM_AUTH_BOT_TOKEN=123456:your_bot_token
```

You can also set `runtimeConfig.telegramAuth.botToken` in `nuxt.config.ts`, for example from another environment variable. The older `runtimeConfig.TELEGRAM_TOKEN` key (`NUXT_TELEGRAM_TOKEN`) still works.

In development the module prints a warning when it can't find a token.

## Module options

Module options are set under the `telegramAuth` key in `nuxt.config.ts`.

```ts
export default defineNuxtConfig({
  telegramAuth: {
    sessionMaxAge: 60 * 60 * 24, // 24 hours (default)
  },
});
```

### `sessionMaxAge`

- **Type:** `number`
- **Default:** `86400` (24 hours)
- **Unit:** seconds

How long a Telegram session stays valid after `auth_date`. Once this window passes, the server returns `401` and the user must log in again. The cookie expires at the same time.

```ts
telegramAuth: {
  sessionMaxAge: 60 * 60 * 24 * 7, // 7 days
}
```

---

## How sessions work

- The widget posts the login data to `POST /api/telegram/session`. The server checks Telegram's signature with your bot token and rejects logins older than `sessionMaxAge`.
- A valid login is stored in the `tg_user` cookie. The cookie is `HttpOnly` and `SameSite=Lax`, so scripts on the page can't read it.
- In production the cookie is also `Secure`, so your site needs HTTPS. Browsers treat `localhost` as secure, which means local testing works over plain HTTP.
- The server only accepts logins posted from your own site. Requests from other sites get `403`.
- `GET /api/telegram/session` checks the signature again on every request. Its response has `Cache-Control: private, no-store`, so a cache never serves one visitor's session to another.
- `DELETE /api/telegram/session` removes the cookie.

## Protecting Server Routes

The module auto-imports two server utilities you can use directly inside your server routes:

### `requireTelegramSession(event)`

Validates the session and returns it. Throws a `401` if the session is missing or invalid, no manual checks needed.

```ts
// server/api/dashboard.get.ts
export default defineEventHandler(async (event) => {
  const session = await requireTelegramSession(event);
  // session is typed as ITelegramSession
  return { user: session.first_name };
});
```

### `getTelegramSession(event)`

Like `requireTelegramSession`, but returns `null` instead of throwing when there's no valid session. Useful when auth is optional.

```ts
// server/api/profile.get.ts
export default defineEventHandler(async (event) => {
  const session = await getTelegramSession(event);
  if (!session) return { guest: true };
  return { user: session.first_name };
});
```

Both utilities are auto-imported, no need to import them manually in your server routes.
