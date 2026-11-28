---
title: "Save Telegram Users to Your Database on Login"
titleTemplate: false
description: "Use nuxt-telegram-auth's server hooks to save Telegram users to your database, add a role to the session or refuse a login, with what each hook receives."
headline: "Saving Telegram users to a database when they log in"
date: "2026-11-28"
keyword: "telegram login save users to database"
---

# Saving Telegram users to a database when they log in

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">nuxt-telegram-auth needs no database: the session lives in a sealed cookie. Most apps still want a users table, for roles, settings or bans. The module's server hooks are the place to connect the two, because they run after Telegram's data is verified and before the session is written.</p>

## The hooks

| Hook                    | Receives                                     | Runs                                                     |
| ----------------------- | -------------------------------------------- | -------------------------------------------------------- |
| `telegram-auth:login`   | `{ event, provider, user, claims, session }` | After verification, before the session cookie is written |
| `telegram-auth:session` | `{ event, session }`                         | On every `GET /api/telegram/session` that has a session  |
| `telegram-auth:logout`  | `{ event, session }`                         | When a session is removed                                |
| `telegram-auth:error`   | `{ event, provider, error }`                 | When a login fails                                       |

`provider` is `"oidc"` for the redirect login, `"sdk"` for the popup and `"legacy"` for the old widget. `user.id` is Telegram's numeric user id, the same for every method, so it is the column to key your table on.

## Save or update the user

Register the hook in a server plugin:

```ts
// server/plugins/telegram.ts
import { useServerHooks } from "nuxt/server";

export default () => {
  useServerHooks().hook("telegram-auth:login", async ({ user }) => {
    await db.users.upsert({
      telegramId: user.id,
      firstName: user.first_name,
      username: user.username,
    });
  });
};
```

`db.users.upsert` stands for whatever your database layer offers. An upsert keyed on `telegramId` creates the row on the first login and updates names and usernames on later ones, since Telegram users can change both.

The plugin is a plain function rather than `defineNitroPlugin`, so it also works with `compatibilityVersion: 5`, where Nitro's auto-imports are off.

## Add a role to the session

Whatever you put in `session.data` is sealed into the cookie with the rest of the session:

```ts
useServerHooks().hook("telegram-auth:login", async ({ user, session }) => {
  const account = await db.users.upsert({ telegramId: user.id, name: user.first_name });
  session.data.role = account.role;
});
```

Later, `requireTelegramSession(event)` returns it as `session.data.role`. Keep it small: browsers drop cookies over 4096 bytes, so store an id and a role, not the whole account.

## Refuse a login

Throw from the hook and the session is never written:

```ts
import { createError, useServerHooks } from "nuxt/server";

export default () => {
  useServerHooks().hook("telegram-auth:login", async ({ user }) => {
    const account = await db.users.findByTelegramId(user.id);
    if (account?.banned) throw createError({ status: 403 });
  });
};
```

A refused popup login answers `403`, and the button reports `denied`. A refused redirect login lands on your login page with `?telegram_error=denied`. The hook runs before the write in the source, so a denied login never touches the cookie.

## Keep the session fresh

The sealed cookie keeps what was true at login time for `session.maxAge`. If a role changes in your database, the `telegram-auth:session` hook can correct what the browser sees:

```ts
useServerHooks().hook("telegram-auth:session", async ({ session }) => {
  const account = await db.users.findByTelegramId(session.user.id);
  session.data = { ...session.data, role: account?.role };
});
```

Changes made here go into the `GET /api/telegram/session` response, not into the cookie. Server routes that make decisions should read the role from the database too, not only from the cookie.

## Clean up on logout and log failures

`telegram-auth:logout` is the place to write an audit entry or clear a cache. `telegram-auth:error` receives the error of every failed login, which helps when users report that the button "does nothing": a missing client id, a blocked popup and an expired nonce each have their own code, listed on the [Telegram Login page](/telegram-login#errors).

The [sessions and hooks reference](/sessions) has the full types.

## Related posts

- [Nuxt auth middleware: protecting pages and server routes](/blog/nuxt-auth-middleware)
- [Sealed cookies or JWTs for Nuxt sessions](/blog/nuxt-sealed-cookies-vs-jwt)
- [Verifying a Telegram login on the server](/blog/telegram-login-verification)
- [Getting a Telegram user ID in your app, and storing it safely](/blog/telegram-user-id)
- [All posts](/blog/)
