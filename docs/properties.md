# Properties

## TelegramLoginWidget

The `<TelegramLoginWidget>` component renders the official Telegram login button.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `telegram-login` | `string` | — | **Required.** Your bot's username (without `@`). |
| `mode` | `'callback' \| 'redirect'` | `'callback'` | `callback` fires `@callback` on the current page. `redirect` sends the user to `redirect-url` after login. |
| `redirect-url` | `string` | `''` | The URL to redirect to when `mode` is `'redirect'`. |
| `request-access` | `'read' \| 'write'` | `'read'` | Permission level requested from the user. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size. |
| `userpic` | `boolean` | `true` | Whether to show the user's avatar on the button. |
| `radius` | `string` | `'0'` | Border radius of the button (CSS value, e.g. `'8'`). |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@callback` | `TelegramUser` | Fired after successful login (callback mode only). |
| `@loaded` | — | Fired when the Telegram widget script has loaded. |

### Example

```vue
<TelegramLoginWidget
  telegram-login="my_bot"
  size="large"
  :userpic="true"
  radius="8"
  @callback="onLogin"
  @loaded="onWidgetLoaded"
/>
```

---

## useUserSession()

Composable for accessing and managing the current Telegram session.

```ts
const { session, loading, error, clearSession, refresh } = useUserSession()
```

### Return values

| Name | Type | Description |
|------|------|-------------|
| `session` | `Ref<ITelegramSession>` | Reactive session object. Always available; check `session.loggedIn` to determine auth state. |
| `loading` | `Ref<boolean>` | `true` while a session fetch is in progress. |
| `error` | `Ref<string \| null>` | Error message if the last fetch failed, otherwise `null`. |
| `clearSession()` | `() => Promise<void>` | Logs the user out: calls `DELETE /api/telegram/session` and resets local state. |
| `refresh()` | `() => Promise<void>` | Re-fetches the session from the server. |

### ITelegramSession

```ts
interface ITelegramSession {
  loggedIn: boolean
  status: number
  id?: number
  message?: string
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date?: Date
  hash?: string
}
```

---

## Server Utilities

For protecting server routes, see [Configuration → Protecting Server Routes](/configuration#protecting-server-routes).
