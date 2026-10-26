# Configuration

## Environment

Secrets and per-environment values come from runtime config, so one build works everywhere:

| Variable                              | Needed for                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `NUXT_APP_SECRET`                     | Sealing sessions in production (at least 32 characters).                       |
| `NUXT_PUBLIC_TELEGRAM_AUTH_CLIENT_ID` | Telegram Login. Your bot's numeric id.                                         |
| `NUXT_TELEGRAM_AUTH_CLIENT_SECRET`    | The redirect login only.                                                       |
| `NUXT_TELEGRAM_AUTH_BOT_TOKEN`        | The old [login widget](/properties) only.                                      |
| `NUXT_TELEGRAM_AUTH_SESSION_PASSWORD` | Optional. Seals sessions instead of a secret derived from `NUXT_APP_SECRET`.   |
| `NUXT_TELEGRAM_AUTH_REDIRECT_URL`     | Optional. The full callback URL, when the one built from the request is wrong. |

In development the module warns about missing or mismatched values, such as a client ID that belongs to a different bot than the bot token.

## Module options

Set these under `telegramAuth` in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  telegramAuth: {
    session: { maxAge: 60 * 60 * 24 * 7 },
    scope: ["phone"],
    loginPath: "/login",
  },
});
```

| Option                       | Default                | Description                                                                                                                                  |
| ---------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `session.name`               | `'nuxt-telegram-auth'` | Cookie name.                                                                                                                                 |
| `session.maxAge`             | `86400`                | Session length in seconds, counted from the login.                                                                                           |
| `session.cookie`             | `{}`                   | Changes to the cookie's `HttpOnly`, `Secure`, `SameSite=Lax` defaults, e.g. `{ secure: false }` for testing over plain HTTP on your network. |
| `scope`                      | `[]`                   | Adds `'phone'` or `'write'`. Profile data is always requested, because the user id comes with it.                                            |
| `loginPath`                  | `'/login'`             | See [Page protection](/pages).                                                                                                               |
| `redirectAfterLogin`         | `'/'`                  | See [Page protection](/pages).                                                                                                               |
| `protectAll`                 | `false`                | See [Page protection](/pages).                                                                                                               |
| `compat.useUserSession`      | `true`                 | Registers the deprecated 1.x composable.                                                                                                     |
| `compat.migrateLegacyCookie` | `true`                 | Converts a valid 1.x `tg_user` cookie into a session.                                                                                        |
| `sessionMaxAge`              |                        | Deprecated name of `session.maxAge`.                                                                                                         |

## Routes

| Route                          | Description                                               |
| ------------------------------ | --------------------------------------------------------- |
| `GET /api/telegram/session`    | The current session, or `{ loggedIn: false }`.            |
| `DELETE /api/telegram/session` | Logs out.                                                 |
| `POST /api/telegram/nonce`     | Starts a popup login.                                     |
| `POST /api/telegram/sdk`       | Finishes a popup login with the `id_token` from Telegram. |
| `GET /auth/telegram`           | Starts the redirect login.                                |
| `GET /auth/telegram/callback`  | Finishes the redirect login.                              |
| `POST /api/telegram/session`   | Logs in with the old widget.                              |
| `GET /api/telegram/callback`   | Finishes an old widget login in redirect mode.            |

Every answer carries `Cache-Control: private, no-store`, so a cache never hands one visitor's session to another. The login routes accept only JSON from your own site.
