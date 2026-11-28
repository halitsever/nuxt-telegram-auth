---
title: "HttpOnly Cookie: What It Blocks and What It Does Not"
titleTemplate: false
description: "What the HttpOnly cookie attribute does, a Chrome test of document.cookie with and without it, what it does not stop, and how a Nuxt session cookie uses it."
headline: "HttpOnly cookies, tested: hidden from scripts, still sent with requests"
date: "2026-11-28"
keyword: "httponly cookie"
faq:
  [
    { "q": "What is an HttpOnly cookie?", "a": "A cookie set with the HttpOnly attribute. The browser still sends it with matching requests, but JavaScript on the page cannot read it through document.cookie." },
    {
      "q": "Does HttpOnly prevent XSS?",
      "a": "No. It stops injected scripts from reading and copying the cookie, but a script running on your page can still send requests that carry it. Preventing XSS itself is a separate job.",
    },
    { "q": "Can JavaScript set an HttpOnly cookie?", "a": "No. document.cookie cannot create or overwrite an HttpOnly cookie. Only a Set-Cookie header from the server can set it." },
  ]
---

# HttpOnly cookies, tested: hidden from scripts, still sent with requests

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">HttpOnly is one word at the end of a Set-Cookie header, and it decides whether scripts on your page can read the cookie. For session cookies that matters a lot. We tested it in headless Chrome 157 and then looked at how nuxt-telegram-auth sets its session cookie.</p>

## What the attribute does

[MDN's Set-Cookie reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie) describes `HttpOnly` as forbidding JavaScript from accessing the cookie, for example through `document.cookie`. The cookie still goes out with every request it matches.

```http
Set-Cookie: session=abc; Path=/; HttpOnly; Secure; SameSite=Lax
```

## The test

A local server set three cookies on one response:

```http
Set-Cookie: session=abc; Path=/; HttpOnly; SameSite=Lax
Set-Cookie: strict=1; Path=/; SameSite=Strict
Set-Cookie: theme=dark; Path=/; SameSite=Lax
```

Then the page read `document.cookie`:

```txt
strict=1; theme=dark
```

`session` was missing, yet the next request to the same server arrived with `Cookie: session=abc; strict=1; theme=dark`. Hidden from scripts, still sent to the server: that is all HttpOnly does.

## What it protects against

If an attacker manages to run JavaScript on your page (cross-site scripting), the classic move is to read `document.cookie` and send the session ID to their own server. With HttpOnly that read returns nothing, so the session cannot be copied out and reused from another machine.

## What it does not protect against

- **Requests from the page itself.** An injected script can still call `fetch('/api/account')`, and the browser attaches the HttpOnly cookie. The attacker acts as the user for as long as the page is open.
- **Cross-site requests.** Whether other sites can trigger requests that carry the cookie is decided by `SameSite`, not `HttpOnly`. See [SameSite=Lax, Strict and None](/blog/samesite-cookie-lax).
- **Network eavesdropping.** That is what `Secure` is for: the cookie is only sent over HTTPS.
- **Someone with access to the device.** Browser storage, extensions and DevTools can still see it.

So HttpOnly limits the damage of an XSS bug; it does not prevent the bug.

## Setting it

```js
// Node.js, no framework
res.setHeader("Set-Cookie", "session=abc; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400");
```

```js
// Express
res.cookie("session", "abc", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 86_400_000 });
```

Note that Express's `maxAge` is in milliseconds, while the `Max-Age` attribute itself is in seconds.

JavaScript cannot create an HttpOnly cookie: the attribute is only honoured in a `Set-Cookie` header.

## How nuxt-telegram-auth uses it

The module keeps the whole Telegram session (user ID, name, provider, login time and anything your login hooks add) in one sealed cookie called `nuxt-telegram-auth`. Its tests check that the cookie is `HttpOnly` and `SameSite=Lax`, and the module's option comment lists `Secure` as the third default. Sealed means encrypted and authenticated with your `NUXT_APP_SECRET`, so the browser holds it but can neither read nor change it; HttpOnly adds that page scripts cannot even see it.

That is also why the client side never reads the cookie. `useTelegramSession()` asks the server (`GET /api/telegram/session`), and the server opens the cookie:

```ts
const { user, loggedIn } = useTelegramSession();
```

You can override `domain`, `secure` and `sameSite` through `telegramAuth.session.cookie` in `nuxt.config`, for example `secure: false` to test over plain HTTP on a local network. HttpOnly is not one of the options. [Sessions and hooks](/sessions) lists the rest.

## Size

HttpOnly cookies are still cookies, with the usual 4 KB limit per cookie in browsers. In development, nuxt-telegram-auth warns when its session cookie passes 3,072 bytes, so that data you add in login hooks does not push it over the edge.

## FAQ

### What is an HttpOnly cookie?

A cookie set with the HttpOnly attribute. The browser still sends it with matching requests, but JavaScript on the page cannot read it through document.cookie.

### Does HttpOnly prevent XSS?

No. It stops injected scripts from reading and copying the cookie, but a script running on your page can still send requests that carry it. Preventing XSS itself is a separate job.

### Can JavaScript set an HttpOnly cookie?

No. document.cookie cannot create or overwrite an HttpOnly cookie. Only a Set-Cookie header from the server can set it.

## Related posts

- [SameSite=Lax, Strict and None](/blog/samesite-cookie-lax)
- [Sealed cookies or JWTs for Nuxt sessions](/blog/nuxt-sealed-cookies-vs-jwt)
- [Sessions and hooks](/sessions)
- [All posts](/blog/)
