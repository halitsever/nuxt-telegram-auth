---
title: "JWKS Explained: JSON Web Key Sets and jwks_uri"
titleTemplate: false
description: "What a JSON Web Key Set is, how a jwks_uri and kid let you verify a JWT, what Telegram's JWKS endpoint contains, and how to verify a token with jose in Node.js."
headline: "What a JWKS is and how servers use it to verify JWTs"
date: "2026-11-28"
keyword: "jwks"
faq:
  [
    {
      "q": "What is a JWKS?",
      "a": "A JSON Web Key Set: a JSON document with a keys array of public keys, defined in RFC 7517. Identity providers publish one so anyone can verify the signatures on the tokens they issue.",
    },
    {
      "q": "What is the difference between JWT and JWKS?",
      "a": "A JWT is a signed token. A JWKS is the list of public keys used to check that signature. The kid in the JWT header names which key in the set signed it.",
    },
    { "q": "Where is Telegram's JWKS?", "a": "At https://oauth.telegram.org/.well-known/jwks.json, listed as jwks_uri in Telegram's openid-configuration document." },
  ]
---

# What a JWKS is and how servers use it to verify JWTs

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">When an identity provider signs a token, you need its public key to check the signature. A JWKS, JSON Web Key Set, is how providers publish those keys: one JSON document at a well-known URL that your server fetches and caches. Here is what is in one, using Telegram's real key set, and how verification uses it.</p>

## What one looks like

A JWKS is defined in [RFC 7517](https://www.rfc-editor.org/rfc/rfc7517): an object with a `keys` array, where each entry is a JSON Web Key (JWK). Telegram publishes its set at the `jwks_uri` from its [openid-configuration](https://oauth.telegram.org/.well-known/openid-configuration). On 28 November 2026 it held four keys:

| kid             | alg    | Key type        |
| --------------- | ------ | --------------- |
| `oidc-1`        | RS256  | RSA             |
| `oidc-es256-1`  | ES256  | EC, curve P-256 |
| `oidc-eddsa-1`  | EdDSA  | OKP, Ed25519    |
| `oidc-es256k-1` | ES256K | EC, secp256k1   |

The RSA entry, shortened:

```json
{
  "kid": "oidc-1",
  "alg": "RS256",
  "kty": "RSA",
  "e": "AQAB",
  "n": "5RneLtsKvVcxdv6gu6gxEQu30Cru5NiM...",
  "key_ops": ["verify"]
}
```

`n` and `e` are the RSA modulus and exponent, base64url encoded. Only public keys belong in a JWKS; the private keys never leave the provider.

## How a verifier uses it

A JWT header names the algorithm and the key:

```json
{ "alg": "RS256", "kid": "oidc-1" }
```

The verifier fetches the JWKS once, finds the key with that `kid`, checks the signature, and then checks the claims: issuer (`iss`), audience (`aud`), expiry (`exp`). Telegram's [login documentation](https://core.telegram.org/widgets/login) lists exactly those checks for its ID tokens, with `iss` equal to `https://oauth.telegram.org` and `aud` equal to your bot's ID.

## Verifying with jose

```js
import { createRemoteJWKSet, jwtVerify } from "jose";

const jwks = createRemoteJWKSet(new URL("https://oauth.telegram.org/.well-known/jwks.json"));

const { payload } = await jwtVerify(idToken, jwks, {
  issuer: "https://oauth.telegram.org",
  audience: process.env.TELEGRAM_CLIENT_ID,
  algorithms: ["RS256", "ES256"],
});
```

We tested the same calls with jose 6.2 and a key pair of our own, published as a one-key local set with `createLocalJWKSet`:

| Case                                     | Result                                  |
| ---------------------------------------- | --------------------------------------- |
| correct token                            | verified, claims returned               |
| right signature, wrong `audience` option | `ERR_JWT_CLAIM_VALIDATION_FAILED`       |
| payload edited after signing             | `ERR_JWS_SIGNATURE_VERIFICATION_FAILED` |
| our token checked against Telegram's set | `ERR_JWKS_NO_MATCHING_KEY`              |

The last line is the point of a JWKS: a token signed by anyone else has no matching key.

## Caching and key rotation

Fetching the set on every login would be slow and would hammer the provider. `createRemoteJWKSet` caches the keys and fetches again when a token arrives with a `kid` it has not seen, which is how providers rotate keys: publish the new key, start signing with it, retire the old one later. nuxt-telegram-auth keeps one remote key set per URL for the life of the server for the same reason. It also reads a key set given inline in the runtime config key `telegramAuth.oidc.jwks`, for servers that cannot reach Telegram, at the cost of updating it by hand when Telegram rotates keys.

## Pin the algorithms

Always pass `algorithms`. A verifier that accepts whatever `alg` the token claims has been the source of real vulnerabilities. nuxt-telegram-auth allows only `RS256` and `ES256`, and refuses tokens signed with `EdDSA` or `ES256K` with a clear error: Telegram's docs restrict those two to the `openid` scope, so their tokens carry no Telegram user ID, and the module needs one. If your bot was switched to one of them, change it back under Login Widget, Advanced, in BotFather.

## JWKS vs a shared secret

The older Telegram login widget signs its data with an HMAC derived from your bot token, a shared secret, so only your server can check it, and anyone with the token could forge logins. With Telegram Login, Telegram signs with a private key and you verify with the public JWKS, so verifying needs no secret at all. [Verifying a Telegram login](/blog/telegram-login-verification) compares the two in detail.

## FAQ

### What is a JWKS?

A JSON Web Key Set: a JSON document with a keys array of public keys, defined in RFC 7517. Identity providers publish one so anyone can verify the signatures on the tokens they issue.

### What is the difference between JWT and JWKS?

A JWT is a signed token. A JWKS is the list of public keys used to check that signature. The kid in the JWT header names which key in the set signed it.

### Where is Telegram's JWKS?

At https://oauth.telegram.org/.well-known/jwks.json, listed as jwks_uri in Telegram's openid-configuration document.

## Related posts

- [Verifying a Telegram login on the server](/blog/telegram-login-verification)
- [PKCE in plain terms](/blog/what-is-pkce)
- [ID token or access token?](/blog/id-token-vs-access-token)
- [Sealed cookies or JWTs for Nuxt sessions](/blog/nuxt-sealed-cookies-vs-jwt)
- [All posts](/blog/)
