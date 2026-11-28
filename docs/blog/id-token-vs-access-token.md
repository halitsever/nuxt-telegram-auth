---
title: "ID Token vs Access Token: Which One Proves Login?"
titleTemplate: false
description: "How an ID token differs from an access token in OAuth 2.0 and OpenID Connect, which one proves who logged in, and why Telegram Login only needs the ID token."
headline: "ID token or access token: what each one is for in OpenID Connect"
date: "2026-11-28"
keyword: "access token vs id token"
faq:
  [
    {
      "q": "What is the difference between an ID token and an access token?",
      "a": "An ID token tells your app who logged in and is meant to be read by your app. An access token lets your app call an API on the user's behalf and is meant for that API, not for your app to read.",
    },
    { "q": "Can I use an access token to log users in?", "a": "No. An access token says what the bearer may do at an API, not who logged in to your app. Use the ID token, validated, for login." },
    { "q": "Is an ID token always a JWT?", "a": "Yes. OpenID Connect Core defines the ID token as a JSON Web Token, signed by the provider and usually not encrypted." },
  ]
---

# ID token or access token: what each one is for in OpenID Connect

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">An OpenID Connect token response usually contains two tokens, and they look alike. They answer different questions: the ID token says who logged in, the access token says what the bearer may do at an API. Telegram Login returns both, and nuxt-telegram-auth uses only one of them, which makes it a useful example.</p>

## The two tokens

|                 | ID token                                                                     | Access token                                                  |
| --------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Defined by      | [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html) | OAuth 2.0, [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749) |
| Answers         | who authenticated, when, for which client                                    | what the bearer may access                                    |
| Audience        | your app (the client ID)                                                     | an API (a resource server)                                    |
| Format          | always a JWT                                                                 | provider's choice: a JWT or an opaque string                  |
| Your app should | validate it and read its claims                                              | send it to the API, not parse it                              |

OpenID Connect added the ID token on top of OAuth 2.0 precisely because an access token does not tell a client who the user is.

## What Telegram returns

Telegram's [login documentation](https://core.telegram.org/widgets/login) shows the token endpoint response:

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJhbGciOiJ..."
}
```

and an example of a decoded ID token:

```json
{
  "iss": "https://oauth.telegram.org",
  "aud": "123456789",
  "sub": "1234123412341234123",
  "iat": 1700000000,
  "exp": 1700003600,
  "id": 987654321,
  "name": "John Doe",
  "preferred_username": "johndoe"
}
```

Everything a login needs is in the ID token: `iss` and `aud` to check it was issued by Telegram for your bot, `exp` for its lifetime, and with the `profile` scope the numeric Telegram user ID in `id`.

## Why nuxt-telegram-auth drops the access token

An access token is only worth something if there is an API to call with it. In OpenID Connect, that API is usually the provider's userinfo endpoint. Telegram's [openid-configuration](https://oauth.telegram.org/.well-known/openid-configuration) lists authorization, token and JWKS endpoints, and no `userinfo_endpoint`, and Telegram puts all requested user data into the ID token instead. The module's code says it in one line: Telegram's access token is useless without a userinfo endpoint, so it is dropped. The token exchange keeps the `id_token`, validates it, and builds the session from its claims.

## How the ID token is validated

Reading claims from an unvalidated JWT is the classic mistake. nuxt-telegram-auth checks, with jose:

- the signature against Telegram's [JWKS](/blog/what-is-jwks), allowing only RS256 and ES256
- `iss` is `https://oauth.telegram.org`, `aud` is your client ID
- `exp` and `iat` are present and valid, with 30 seconds of clock tolerance
- the `nonce` matches the one issued for this login

Only then does it read `id` and the profile claims. After that the ID token has done its job: the module does not keep it, and writes its own sealed session cookie instead. [Sealed cookies or JWTs](/blog/nuxt-sealed-cookies-vs-jwt) explains that choice.

## Common mix-ups

- **Sending the ID token to your API as a bearer token.** It works technically, but the ID token's audience is the client, not the API, and it was not designed to authorise API calls.
- **Parsing the access token to get the user.** Some providers issue JWT access tokens, others opaque strings. Code that reads one breaks when the format changes.
- **Using `sub` as a Telegram user ID.** In Telegram's tokens `sub` is an opaque identifier, and the module's types note it differs for every bot. The numeric user ID is the separate `id` claim. [Getting a Telegram user ID](/blog/telegram-user-id) covers the difference.

## FAQ

### What is the difference between an ID token and an access token?

An ID token tells your app who logged in and is meant to be read by your app. An access token lets your app call an API on the user's behalf and is meant for that API, not for your app to read.

### Can I use an access token to log users in?

No. An access token says what the bearer may do at an API, not who logged in to your app. Use the ID token, validated, for login.

### Is an ID token always a JWT?

Yes. OpenID Connect Core defines the ID token as a JSON Web Token, signed by the provider and usually not encrypted.

## Related posts

- [What a JWKS is](/blog/what-is-jwks)
- [PKCE in plain terms](/blog/what-is-pkce)
- [Verifying a Telegram login on the server](/blog/telegram-login-verification)
- [Sealed cookies or JWTs for Nuxt sessions](/blog/nuxt-sealed-cookies-vs-jwt)
- [All posts](/blog/)
