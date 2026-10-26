# Migrating from 1.x

2.0 adds Telegram Login and moves every login to one sealed session. Most of the move is mechanical; logged-in users stay logged in.

## Before you upgrade

- **Nuxt 4.6 or newer.** 1.x stays available for older apps.
- **A session secret in production.** Set `NUXT_APP_SECRET` (at least 32 characters, e.g. `openssl rand -base64 32`) or `NUXT_TELEGRAM_AUTH_SESSION_PASSWORD`.

The tests also run on Nuxt 4.6 with `future.compatibilityVersion: 5`. Nuxt 5 itself, with Nitro v3, isn't tested yet.

## What changes

**The session cookie.** The unsealed `tg_user` cookie is replaced by the sealed `nuxt-telegram-auth` cookie. A valid `tg_user` is converted on the user's next visit and then deleted, and the new session ends when the old one would have. Turn this off with `compat.migrateLegacyCookie: false`.

**The composable.** `useUserSession()` still works but is deprecated and warns in development. Move to `useTelegramSession()`:

| 1.x                        | 2.0                                                       |
| -------------------------- | --------------------------------------------------------- |
| `session.value.loggedIn`   | `loggedIn.value`                                          |
| `session.value.first_name` | `user.value?.first_name` (same for the other user fields) |
| `loading`                  | `!ready.value`                                            |
| `clearSession()`           | `clear()`                                                 |
| `refresh()`                | `fetch()`                                                 |

`fetchSession`, `useSessionState` and the standalone `clearSession` were auto-imported by accident in 1.x and are gone. With nuxt-auth-utils installed, the module doesn't register `useUserSession` at all.

**The session API.** `GET /api/telegram/session` answers `{ loggedIn: true, user, provider, loggedInAt }` or `{ loggedIn: false }` instead of flat user fields with a `status`. `getTelegramSession` and `requireTelegramSession` return the same `TelegramSession` shape, so `session.first_name` becomes `session.user.first_name`.

**Types.** `ITelegramSession`, `ITelegramUser` and `IUserSession` are gone. Use `TelegramSession` and `TelegramUser`; the widget's callback payload is `TelegramWidgetUser`.

**Configuration.**

| 1.x                                                    | 2.0                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `telegramAuth.sessionMaxAge`                           | `telegramAuth.session.maxAge` (the old name still works and warns) |
| `runtimeConfig.TELEGRAM_TOKEN` / `NUXT_TELEGRAM_TOKEN` | `NUXT_TELEGRAM_AUTH_BOT_TOKEN` (the old key still works and warns) |
| `request-access="read"` on the widget                  | removed; leave the prop out                                        |

**The widget.** `<TelegramLoginWidget>` keeps its props but no longer renders `id="telegram"`.

## Moving to Telegram Login

The old widget keeps working for bots that haven't switched. When you're ready:

1. Replace `<TelegramLoginWidget>` with [`<TelegramLoginButton>`](/telegram-login#telegramloginbutton) and set the client ID (and the client secret, for the redirect login).
2. In BotFather, turn on the bot's Login Widget and fill in Allowed URLs.
3. Deploy both changes together. Once the bot uses Telegram Login, Telegram shows "Bot domain invalid" in the old widget everywhere. BotFather has no obvious setting to turn Telegram Login off again, so plan for a one-way switch.

Users keep their accounts: `user.id` is Telegram's numeric user id with both methods. In development the old widget warns when a client ID is configured, since that usually means the bot has already switched.
