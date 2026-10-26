# Login widget (legacy)

`<TelegramLoginWidget>` renders Telegram's old login widget. It keeps working for bots that haven't turned on [Telegram Login](/telegram-login). Once a bot does, Telegram shows "Bot domain invalid" in this widget on every domain, so plan the [move](/migration#moving-to-telegram-login).

The widget needs the bot token and your domain set with `/setdomain` in [@BotFather](https://t.me/BotFather):

```bash
NUXT_TELEGRAM_AUTH_BOT_TOKEN=123456:your_bot_token
```

```vue
<TelegramLoginWidget telegram-login="my_bot" size="large" @callback="onLogin" />
```

When someone logs in, the widget posts Telegram's signed data to the server, which checks the signature with your bot token and creates the same session as the other login methods. `@callback` fires after that, so you can navigate right away.

Telegram draws only one widget per bot on a page; a second one for the same bot stays empty.

| Prop             | Type                             | Default            | Description                                                                                                                              |
| ---------------- | -------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `telegram-login` | `string`                         | (required)         | Your bot's username, without `@`.                                                                                                        |
| `mode`           | `'callback' \| 'redirect'`       | `'callback'`       | `callback` logs the user in on the current page. `redirect` sends the browser to a URL after login. See [Redirect mode](/redirect-mode). |
| `redirect-to`    | `string`                         | current page       | Where to land after a redirect mode login. Must be a path on your site.                                                                  |
| `redirect-url`   | `string`                         |                    | A custom URL for Telegram to redirect to in redirect mode, instead of the module's callback route.                                       |
| `request-access` | `'write'`                        |                    | Set to `'write'` to ask the user to let your bot send them messages.                                                                     |
| `size`           | `'small' \| 'medium' \| 'large'` | `'medium'`         | Button size.                                                                                                                             |
| `userpic`        | `boolean`                        | `true`             | Whether to show the user's avatar on the button.                                                                                         |
| `radius`         | `string`                         | Telegram's default | Corner radius in pixels, e.g. `'8'`. `'0'` gives square corners.                                                                         |
| `lang`           | `string`                         |                    | Language of the button text, e.g. `'tr'`.                                                                                                |

| Event       | Payload              | Description                                                         |
| ----------- | -------------------- | ------------------------------------------------------------------- |
| `@callback` | `TelegramWidgetUser` | Callback mode: the server checked the login and stored the session. |
| `@loaded`   | none                 | Telegram's widget script has loaded.                                |

Read the session with [`useTelegramSession()`](/sessions#usetelegramsession). The 1.x `useUserSession()` still works but is deprecated.
