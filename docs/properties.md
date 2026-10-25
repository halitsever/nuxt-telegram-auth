# Properties

## TelegramLoginWidget

The `<TelegramLoginWidget>` component renders the official Telegram login button. Telegram draws only one button per bot on a page, so a second widget for the same bot stays empty. To offer both modes, show one widget at a time.

| Prop             | Type                             | Default            | Description                                                                                                                              |
| ---------------- | -------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `telegram-login` | `string`                         | (required)         | Your bot's username (without `@`).                                                                                                       |
| `mode`           | `'callback' \| 'redirect'`       | `'callback'`       | `callback` logs the user in on the current page. `redirect` sends the browser to a URL after login. See [Redirect mode](/redirect-mode). |
| `redirect-to`    | `string`                         | current page       | Where to land after a redirect mode login. Must be a path on your site.                                                                  |
| `redirect-url`   | `string`                         |                    | A custom URL for Telegram to redirect to in redirect mode, instead of the module's callback route.                                       |
| `request-access` | `'write'`                        |                    | Set to `'write'` to ask the user to let your bot send them messages.                                                                     |
| `size`           | `'small' \| 'medium' \| 'large'` | `'medium'`         | Button size.                                                                                                                             |
| `userpic`        | `boolean`                        | `true`             | Whether to show the user's avatar on the button.                                                                                         |
| `radius`         | `string`                         | Telegram's default | Corner radius of the button in pixels, e.g. `'8'`. Use `'0'` for square corners.                                                         |
| `lang`           | `string`                         |                    | Language of the button text, e.g. `'tr'` or `'en'`.                                                                                      |

### Events

| Event       | Payload         | Description                                                                           |
| ----------- | --------------- | ------------------------------------------------------------------------------------- |
| `@callback` | `ITelegramUser` | Fired in callback mode after the server has checked the login and stored the session. |
| `@loaded`   | none            | Fired when the Telegram widget script has loaded.                                     |

### Example

```vue
<TelegramLoginWidget telegram-login="my_bot" size="large" :userpic="true" radius="8" lang="en" @callback="onLogin" @loaded="onWidgetLoaded" />
```

---

## useUserSession()

Composable for accessing and managing the current Telegram session.

```ts
const { session, loading, error, clearSession, refresh } = useUserSession();
```

### Return values

| Name             | Type                    | Description                                                                                  |
| ---------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| `session`        | `Ref<ITelegramSession>` | Reactive session object. Always available; check `session.loggedIn` to determine auth state. |
| `loading`        | `Ref<boolean>`          | `true` while a session fetch is in progress.                                                 |
| `error`          | `Ref<string \| null>`   | Error message if the last fetch failed, otherwise `null`.                                    |
| `clearSession()` | `() => Promise<void>`   | Logs the user out: calls `DELETE /api/telegram/session` and resets local state.              |
| `refresh()`      | `() => Promise<void>`   | Re-fetches the session from the server.                                                      |

### Types

The types can be imported from the module:

```ts
import type { ITelegramSession, ITelegramUser } from "nuxt-telegram-auth";
```

```ts
interface ITelegramSession {
  loggedIn: boolean;
  status: number;
  id?: number;
  message?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number;
  hash?: string;
}
```

`ITelegramUser` is the login data Telegram sends to the widget, which `@callback` receives.

---

## API routes

| Route                          | Description                                                           |
| ------------------------------ | --------------------------------------------------------------------- |
| `GET /api/telegram/session`    | Returns the current session, or `{ loggedIn: false, status: 401 }`.   |
| `POST /api/telegram/session`   | Checks a login from the widget and sets the session cookie.           |
| `DELETE /api/telegram/session` | Removes the session cookie.                                           |
| `GET /api/telegram/callback`   | Receives redirect mode logins, sets the session cookie and redirects. |

## Server Utilities

For protecting server routes, see [Configuration → Protecting Server Routes](/configuration#protecting-server-routes).
