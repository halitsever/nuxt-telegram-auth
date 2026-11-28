---
title: "What Is PKCE? OAuth's Code Verifier, Explained"
titleTemplate: false
description: "What PKCE is and how the code_verifier and S256 code_challenge protect the OAuth code flow, checked against RFC 7636's test vector, using Telegram Login."
headline: "PKCE in plain terms: the verifier, the challenge and why they exist"
date: "2026-11-28"
keyword: "what is pkce"
faq:
  [
    {
      "q": "What is PKCE?",
      "a": "Proof Key for Code Exchange, RFC 7636. The client makes a random secret, sends only its SHA-256 hash with the login request, and later proves it holds the secret when it exchanges the authorization code for tokens.",
    },
    {
      "q": "Do I need PKCE if my app has a client secret?",
      "a": "It still helps. The OAuth 2.0 Security Best Current Practice recommends PKCE for confidential clients too, because it ties the authorization code to the session that started the login.",
    },
    { "q": "Should I use plain or S256?", "a": "S256. With plain, the challenge is the verifier itself, so anyone who sees the login URL learns the secret. RFC 7636 says clients capable of S256 must use it." },
  ]
---

# PKCE in plain terms: the verifier, the challenge and why they exist

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">PKCE (Proof Key for Code Exchange, said like pixie) is a small addition to the OAuth authorization code flow. It makes a stolen authorization code useless to whoever stole it. Telegram Login supports it, nuxt-telegram-auth always uses it in redirect mode, and the whole mechanism is about twenty lines of code.</p>

## The problem it solves

In the authorization code flow the provider sends the user back to your site with a short-lived `code` in the URL. Your server trades that code for tokens. If someone else gets the code first, from a log, a browser history or a malicious app registered for the same redirect, they can try to trade it themselves. [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636) closes that gap by binding the code to a secret that never travels in a URL.

## How it works

1. **Make a verifier.** A random string, 43 to 128 characters from the unreserved URL characters.
2. **Hash it into a challenge.** `code_challenge = BASE64URL(SHA256(code_verifier))`, the `S256` method.
3. **Send the challenge with the login request:** `code_challenge=...&code_challenge_method=S256`. The provider stores it with the code it issues.
4. **Send the verifier with the token request.** The provider hashes it and compares. No match, no tokens.

Someone who only saw the login URL and the callback has the challenge and the code, but not the verifier, so the exchange fails.

## The code

This is the same approach as `src/runtime/server/lib/pkce.ts` in nuxt-telegram-auth, using only the Web Crypto API, so it runs in Node.js, workers and browsers:

```js
const encoder = new TextEncoder();
const base64url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const randomToken = (n = 32) => base64url(crypto.getRandomValues(new Uint8Array(n)));
const challengeS256 = async (verifier) => base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(verifier))));
```

We checked it against the test vector in RFC 7636 Appendix B. The verifier `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk` must give the challenge `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`, and it does. Thirty-two random bytes encode to a 43-character verifier, the minimum length the RFC allows.

## plain vs S256

RFC 7636 also defines `plain`, where the challenge is the verifier itself. It exists for clients that cannot compute SHA-256. Anyone who sees the login request learns the verifier, so the protection mostly disappears. Telegram's [openid-configuration](https://oauth.telegram.org/.well-known/openid-configuration) lists both `plain` and `S256`; its [login documentation](https://core.telegram.org/widgets/login) recommends S256, and that is what nuxt-telegram-auth sends.

## PKCE, state and nonce

Three random values often travel together in a login. They protect different things:

| Value                              | Sent in                                                   | Protects against                                                       |
| ---------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| `state`                            | the login URL, returned on the callback                   | a forged callback (CSRF): the callback must carry the state you issued |
| `code_verifier` / `code_challenge` | challenge in the login URL, verifier in the token request | a stolen authorization code being exchanged by someone else            |
| `nonce`                            | the login URL, returned inside the ID token               | an ID token being replayed into a different login                      |

nuxt-telegram-auth generates all three per login, seals them with the return path into a cookie called `nuxt-telegram-auth-oidc` that lives 10 minutes, and checks them on `/auth/telegram/callback`. That cookie is always `SameSite=Lax`, because Telegram's redirect back to your site is a cross-site navigation, and a `Strict` cookie would not be sent with it.

## Do confidential clients need it?

A server with a client secret already authenticates the token request, so PKCE used to be described as a feature for mobile and single-page apps. The [OAuth 2.0 Security Best Current Practice, RFC 9700](https://www.rfc-editor.org/rfc/rfc9700), recommends it for confidential clients as well, since it also stops authorization code injection. nuxt-telegram-auth sends both: the client secret as HTTP Basic auth and the verifier in the body of the token request.

## Using it with Telegram Login

With the module you do not write any of this. The redirect login starts at `/auth/telegram`, and the module builds the authorization URL with `response_type=code`, your client ID, `state`, `nonce`, `code_challenge` and `code_challenge_method=S256`. [Telegram Login with OAuth and OpenID Connect](/telegram-login) covers the setup, and [verifying a Telegram login](/blog/telegram-login-verification) covers what happens to the ID token afterwards.

## FAQ

### What is PKCE?

Proof Key for Code Exchange, RFC 7636. The client makes a random secret, sends only its SHA-256 hash with the login request, and later proves it holds the secret when it exchanges the authorization code for tokens.

### Do I need PKCE if my app has a client secret?

It still helps. The OAuth 2.0 Security Best Current Practice recommends PKCE for confidential clients too, because it ties the authorization code to the session that started the login.

### Should I use plain or S256?

S256. With plain, the challenge is the verifier itself, so anyone who sees the login URL learns the secret. RFC 7636 says clients capable of S256 must use it.

## Related posts

- [Verifying a Telegram login on the server](/blog/telegram-login-verification)
- [JWKS explained](/blog/what-is-jwks)
- [ID token or access token?](/blog/id-token-vs-access-token)
- [Telegram Login with OAuth and OpenID Connect](/telegram-login)
- [All posts](/blog/)
