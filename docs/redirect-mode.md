# Redirect mode

In callback mode the widget hands the login to the page it's on. In redirect mode Telegram sends the browser to a URL with the login data instead, so the login ends with a full page load.

```vue
<TelegramLoginWidget telegram-login="my_bot" mode="redirect" redirect-to="/dashboard" />
```

After the user confirms the login, Telegram redirects to `/api/telegram/callback` with the login data in the query string. The module checks the signature, stores the session cookie and redirects to `redirect-to`. Without `redirect-to`, the user comes back to the page the widget was on.

`redirect-to` must be a path on your site. Anything else, like `//example.com` or a full URL, falls back to `/`.

If the login data is invalid or older than `sessionMaxAge`, the callback responds with `401`.

## Using your own handler

Pass `redirect-url` to send the login data to your own route:

```vue
<TelegramLoginWidget telegram-login="my_bot" mode="redirect" redirect-url="/auth/telegram" />
```

Your route then has to check the signature itself before it trusts the data.

## Limits

Telegram's redirect flow has no `state` parameter, so the callback can't tell whether the login started on your site. Someone could send a link that logs the visitor into the sender's account. Callback mode doesn't have this problem, because the server only accepts logins posted from your own pages.
