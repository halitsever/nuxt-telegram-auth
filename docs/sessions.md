# Sessions and hooks

Every login method ends in the same session. It lives in a sealed, HttpOnly cookie called `nuxt-telegram-auth`, so no database is needed and scripts on the page can't read it.

```ts
interface TelegramSession {
  user: TelegramUser;
  provider: "oidc" | "sdk" | "legacy" | "miniapp";
  loggedInAt: number; // unix seconds
  sub?: string; // OpenID subject: opaque and different for every bot
  data?: Record<string, unknown>; // what your login hooks stored
}

interface TelegramUser {
  id: number; // Telegram's numeric user id, the same for every login method
  first_name?: string;
  last_name?: string;
  username?: string;
  name?: string;
  photo_url?: string;
  phone_number?: string; // with the phone scope
}
```

`user.id` stays the same whichever way someone logs in, so moving from the old widget to Telegram Login keeps people in their accounts. The types come from the module: `import type { TelegramSession, TelegramUser } from "nuxt-telegram-auth"`.

## `useTelegramSession()`

```ts
const { session, user, loggedIn, ready, fetch, clear } = useTelegramSession();
```

| Name       | Type                           | Description                                                             |
| ---------- | ------------------------------ | ----------------------------------------------------------------------- |
| `session`  | `Ref<TelegramSession \| null>` | The session, or `null` when nobody is logged in.                        |
| `user`     | `Ref<TelegramUser \| null>`    | `session.user`.                                                         |
| `loggedIn` | `Ref<boolean>`                 |                                                                         |
| `ready`    | `Ref<boolean>`                 | `false` until the first answer from the server.                         |
| `fetch()`  | `() => Promise<void>`          | Loads the session again. Calls made at the same time share one request. |
| `clear()`  | `() => Promise<void>`          | Logs out.                                                               |

The session is loaded once during server rendering, so the first page already shows the right state. On prerendered pages the browser loads it instead.

## Server utilities

These are auto-imported in server routes:

| Function                                     | Returns                                                                                  |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `getTelegramSession(event)`                  | The session, or `null`.                                                                  |
| `requireTelegramSession(event)`              | The session. Throws `401` without one.                                                   |
| `clearTelegramSession(event)`                | Logs the user out.                                                                       |
| `verifyTelegramIdToken(idToken, { nonce? })` | The claims of a Telegram Login `id_token` once it passes the checks. Throws otherwise.   |
| `verifyTelegramWidgetPayload(payload)`       | The user from an old-widget login payload, or `null` when the signature or age is wrong. |

```ts
// server/api/dashboard.get.ts
export default defineEventHandler(async (event) => {
  const { user } = await requireTelegramSession(event);
  return { greeting: `Hello, ${user.first_name}` };
});
```

Pages are protected for the interface only (see [Page protection](/pages)). Anything your API returns needs `requireTelegramSession` on the server.

## Hooks

Hooks let your app react to logins without touching the module. Register them in a server plugin:

```ts
// server/plugins/telegram.ts
import { createError, useServerHooks } from "nuxt/server";

export default () => {
  useServerHooks().hook("telegram-auth:login", async ({ user, session }) => {
    const account = await db.users.upsert({ telegramId: user.id, name: user.first_name });
    if (account.banned) throw createError({ status: 403 });
    session.data.role = account.role;
  });
};
```

The plugin is a plain function, so it also works with `compatibilityVersion: 5`, where Nitro's auto-imports such as `defineNitroPlugin` are off.

| Hook                    | Context                                      | When                                                                                             |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `telegram-auth:login`   | `{ event, provider, user, claims, session }` | Before the session is written. Change `user` or `session.data`, or throw to refuse the login.    |
| `telegram-auth:session` | `{ event, session }`                         | On every `GET /api/telegram/session` with a session. Changes reach the response, not the cookie. |
| `telegram-auth:logout`  | `{ event, session }`                         | When a session is removed.                                                                       |
| `telegram-auth:error`   | `{ event, provider, error }`                 | When a login fails.                                                                              |

A refused login answers `403` to the popup and sends redirect logins to the login page with `?telegram_error=denied`.

## Cookies and secrets

- The session is sealed with `NUXT_APP_SECRET`, or with `NUXT_TELEGRAM_AUTH_SESSION_PASSWORD` if you set one. Either must be at least 32 characters. Changing it logs everyone out.
- The cookie is `HttpOnly`, `Secure` and `SameSite=Lax`. Browsers treat `localhost` as secure, so local development over HTTP works. To test from another device on your network over plain HTTP, set `telegramAuth.session.cookie.secure` to `false` in development.
- A session lasts `session.maxAge` from the login, however often it is read.
- Browsers drop cookies over 4096 bytes. Keep `session.data` small: an id and a role are fine, a whole profile is not. In development the module warns when the cookie gets close.
- Telegram's tokens are checked once and thrown away; the cookie never holds them.
