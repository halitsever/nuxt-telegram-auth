# Telegram Login

Telegram Login is Telegram's current way to log in with a Telegram account. It is built on OpenID Connect: Telegram hands your site a signed `id_token`, and the server checks it against Telegram's public keys before it creates a session. The module supports both ways to start a login:

- **Popup**: `<TelegramLoginButton>` or `useTelegramLogin()` open Telegram's login window over your page.
- **Redirect**: the browser goes to Telegram and comes back to `/auth/telegram/callback`. No JavaScript SDK is involved, and it needs the client secret.

Both end in the same session, so you can mix them. [Quickstart](/installation) shows the BotFather setup.

## Allowed URLs

Telegram only sends the user back to addresses on the bot's **Allowed URLs** list. Add:

- your site's origin, such as `https://example.com`, which covers popup logins on every page
- `https://example.com/auth/telegram/callback` for the redirect login

For local development, a tunnel such as `cloudflared tunnel --url http://localhost:3000` gives you a public HTTPS address to add to the list.

## `<TelegramLoginButton>`

```vue
<TelegramLoginButton :scope="['phone']" variant="outlined" @success="onLogin" @error="onError" />
```

The button uses Telegram's own styling. It stays disabled until Telegram's script has loaded and your server has handed out a nonce. If either fails, the button reports `sdk_load_failed` and a click tries again.

| Prop          | Type                                                    | Default   | Description                                                                                                                 |
| ------------- | ------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `scope`       | `('phone' \| 'write')[]`                                | `[]`      | Extra permissions. `phone` adds the phone number, `write` lets your bot message the user. Profile data is always requested. |
| `lang`        | `string`                                                |           | Language of Telegram's login screen, e.g. `'tr'`.                                                                           |
| `mode`        | `'popup' \| 'redirect'`                                 | `'popup'` | `redirect` sends the browser to Telegram instead of opening a popup.                                                        |
| `redirect-to` | `string`                                                |           | Where to go after the login. See [Where the user lands](#where-the-user-lands).                                             |
| `variant`     | `'square' \| 'outlined' \| 'icon' \| 'shine'` or a list |           | Telegram's button styles. `['outlined', 'shine']` combines two.                                                             |

| Event      | Payload                  | Description                                             |
| ---------- | ------------------------ | ------------------------------------------------------- |
| `@success` | `TelegramUser`           | The session exists and `useTelegramSession()` holds it. |
| `@error`   | `TelegramLoginErrorCode` | The login failed. See [Errors](#errors).                |

The default label is "Log in with Telegram"; put your own text in the slot.

## `useTelegramLogin()`

Use the composable to build your own button:

```vue
<template>
  <button :disabled="!ready || pending" @click="login">Continue with Telegram</button>
  <p v-if="error">Login failed: {{ error }}</p>
</template>

<script setup lang="ts">
const { ready, pending, error, login } = useTelegramLogin({ scope: ["write"] });
</script>
```

It takes the button's options (`scope`, `lang`, `mode`, `redirectTo`) plus `onSuccess(user)` and `onError(code)`, and returns:

| Name      | Type                                  | Description                                                                                |
| --------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| `ready`   | `Ref<boolean>`                        | Telegram's script has loaded and a login can start.                                        |
| `pending` | `Ref<boolean>`                        | A login was started and no answer has come back yet.                                       |
| `error`   | `Ref<TelegramLoginErrorCode \| null>` | Why the last login failed.                                                                 |
| `login`   | `() => void`                          | Starts a login. Call it straight from a click handler, or the browser may block the popup. |

## Redirect login

Link to `/auth/telegram`, or use `mode="redirect"`:

```vue
<a href="/auth/telegram?redirect=/dashboard">Log in with Telegram</a>
```

The module sends the browser to Telegram with PKCE, `state` and `nonce`. On the way back it exchanges the code for an `id_token`, checks it, creates the session and redirects to `redirect`, which must be a path on your site. The redirect login needs `NUXT_TELEGRAM_AUTH_CLIENT_SECRET`.

The callback address is built from the request. Behind a proxy that sets `X-Forwarded-Host` and `X-Forwarded-Proto` this gives your public address. To fix it yourself, set the full URL:

```bash
NUXT_TELEGRAM_AUTH_REDIRECT_URL=https://example.com/auth/telegram/callback
```

If the login fails, the user lands on your [login page](/pages) with `?telegram_error=<code>`. Reloading the callback page after a finished login just continues to `redirectAfterLogin`.

## Where the user lands

- With `redirect-to` set, the user goes there.
- On the login page (`loginPath`), the user goes to its `?redirect=` path, or to `redirectAfterLogin` without one. The login page doesn't have to read the parameter itself.
- Anywhere else, a popup login keeps the user on the page and only the session changes. A redirect login comes back to the same page.

## Errors

| Code                    | Meaning                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| `popup_closed`          | The user closed the popup.                                                                                     |
| `popup_blocked`         | The browser blocked the popup.                                                                                 |
| `sdk_load_failed`       | Telegram's script didn't load.                                                                                 |
| `not_configured`        | The client ID is missing. A missing client secret makes `/auth/telegram` answer 500 with a message instead.    |
| `verification_failed`   | The token from Telegram didn't pass the server's checks.                                                       |
| `unsupported_algorithm` | The bot signs tokens with EdDSA or ES256K. Switch it to RS256 or ES256 in BotFather → Login Widget → Advanced. |
| `expired`               | The login took too long or was already used. Start again.                                                      |
| `invalid_state`         | The redirect came back to a browser that didn't start it.                                                      |
| `denied`                | A `telegram-auth:login` hook refused the user.                                                                 |
| `provider_error`        | Telegram answered with an error.                                                                               |

## Pages with nuxt-security

[nuxt-security](https://nuxt-security.vercel.app) sends `Cross-Origin-Opener-Policy: same-origin` by default, which cuts the popup off from your page. The module prints a warning when it sees that setting. Allow popups instead:

```ts
export default defineNuxtConfig({
  security: {
    headers: {
      crossOriginOpenerPolicy: "same-origin-allow-popups",
    },
  },
});
```
