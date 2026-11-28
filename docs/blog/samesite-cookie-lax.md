---
title: "SameSite=Lax vs Strict vs None: Cookies Tested"
titleTemplate: false
description: "What SameSite=Lax, Strict and None do, tested in Chrome with links, forms, iframes and images, and why OAuth logins break when the state cookie is Strict."
headline: "SameSite cookies in practice: what Lax, Strict and None send"
date: "2026-11-28"
keyword: "cookie samesite lax"
faq:
  [
    {
      "q": "What does SameSite=Lax do?",
      "a": "The cookie is sent on same-site requests and on top-level GET navigations from other sites, such as clicking a link. It is not sent on cross-site POSTs, iframes, images or fetch requests.",
    },
    {
      "q": "What is the difference between SameSite Lax and Strict?",
      "a": "Strict cookies are never sent on requests started by another site, not even when the user clicks a link to you. Lax cookies are sent on those top-level link navigations.",
    },
    { "q": "What does a browser do without a SameSite attribute?", "a": "Chrome treats a cookie without SameSite as Lax. MDN notes that browsers differ here, so set the attribute explicitly." },
  ]
---

# SameSite cookies in practice: what Lax, Strict and None send

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">SameSite decides whether a cookie is sent when another site causes the request. Get it wrong and either your users are exposed to cross-site request forgery, or your login breaks when the identity provider sends them back. We tested Lax and Strict in headless Chrome 157 against the request types that matter.</p>

## The three values

From [MDN's Set-Cookie reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie):

| Value    | Sent on cross-site requests                               |
| -------- | --------------------------------------------------------- |
| `Strict` | never                                                     |
| `Lax`    | only top-level navigations with a safe method such as GET |
| `None`   | always; requires `Secure`                                 |

"Site" means scheme plus registrable domain: `app.example.com` and `api.example.com` are the same site, `example.com` and `example.net` are not.

## The test

Two hostnames, `a.test` and `b.test`, both pointing at one local server. `a.test` set a Lax cookie (`session`, also HttpOnly) and a Strict cookie (`strict`). Then a page on `b.test` reached back to `a.test` in four ways, and the server logged the `Cookie` header each time:

| Request from b.test to a.test              | Lax cookie | Strict cookie |
| ------------------------------------------ | ---------- | ------------- |
| clicking a link (top-level GET)            | sent       | not sent      |
| submitting a form with POST                | not sent   | not sent      |
| an iframe                                  | not sent   | not sent      |
| an image                                   | not sent   | not sent      |
| for comparison: a navigation within a.test | sent       | sent          |

That is the whole model in one table. Lax keeps you logged in when you arrive from a link in an email or a search result, and keeps your cookies off forms, frames and images other sites embed, which is where cross-site request forgery happens.

## Why Strict breaks OAuth callbacks

An OAuth or OpenID Connect login leaves your site and comes back: the provider redirects the browser to your callback URL. That redirect is a top-level navigation started by the provider's site, so it is cross-site. A `Strict` cookie holding the login's `state` and PKCE verifier is not sent with it, and the callback cannot finish.

nuxt-telegram-auth handles this in code. Its transaction cookie, `nuxt-telegram-auth-oidc`, holds `state`, the PKCE verifier and the `nonce` for 10 minutes, and is always set with `SameSite=Lax`, whatever you choose for the session cookie. The source comment says it directly: Telegram's redirect back is a cross-site navigation, so a Strict cookie would never come along. The module's test suite checks that the transaction cookie stays Lax when the session cookie is configured as Strict.

## Choosing a value

- **Session cookies:** `Lax`. It is what nuxt-telegram-auth uses by default, and Chrome's default for cookies without the attribute.
- **Cookies that must never follow a link from elsewhere,** such as a high-risk admin session: `Strict`, accepting that users arriving from a link look logged out until their next same-site request.
- **Cookies for embedded or third-party use,** such as a widget in an iframe on another site: `None; Secure`, and expect browsers that block third-party cookies to drop them anyway.

To make the session cookie Strict in nuxt-telegram-auth:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["nuxt-telegram-auth"],
  telegramAuth: {
    session: { cookie: { sameSite: "strict" } },
  },
});
```

The login still works because the transaction cookie stays Lax, but after the callback a user coming from a link on another site will not have their session sent on that first request.

## SameSite is not a full CSRF defence

Lax still sends cookies on cross-site top-level GETs, so any GET endpoint that changes data is exposed. Keep state-changing actions on POST, PUT or DELETE, and check the `Origin` or `Sec-Fetch-Site` header on them. Also remember that subdomains are the same site: a compromised `blog.example.com` can make same-site requests to `app.example.com`.

## Defaults differ

MDN notes that some browsers use Lax when `SameSite` is missing, Chrome among them, and that in this default mode a cookie set in the last two minutes is still sent on cross-site POSTs. Not every browser applies the default, so set the attribute on every cookie you care about instead of relying on it.

## FAQ

### What does SameSite=Lax do?

The cookie is sent on same-site requests and on top-level GET navigations from other sites, such as clicking a link. It is not sent on cross-site POSTs, iframes, images or fetch requests.

### What is the difference between SameSite Lax and Strict?

Strict cookies are never sent on requests started by another site, not even when the user clicks a link to you. Lax cookies are sent on those top-level link navigations.

### What does a browser do without a SameSite attribute?

Chrome treats a cookie without SameSite as Lax. MDN notes that browsers differ here, so set the attribute explicitly.

## Related posts

- [HttpOnly cookies, tested](/blog/httponly-cookie)
- [PKCE in plain terms](/blog/what-is-pkce)
- [Nuxt auth middleware](/blog/nuxt-auth-middleware)
- [All posts](/blog/)
