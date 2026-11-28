---
title: "Telegram User ID: How to Get It From a Login or Bot"
titleTemplate: false
description: "What a Telegram user ID is, how to get it from a bot update, Telegram Login or the old widget, why sub differs, and why JavaScript can store it as a Number."
headline: "Getting a Telegram user ID in your app, and storing it safely"
date: "2026-11-28"
keyword: "telegram user id"
faq:
  [
    { "q": "What is a Telegram user ID?", "a": "A unique number Telegram assigns to every user and bot. It does not change when the user changes their name or username, so apps use it to recognise accounts." },
    {
      "q": "How do I get a user's Telegram ID in my app?",
      "a": "In a bot, read from.id on incoming messages. On a website, log the user in with Telegram Login and read the id claim of the validated ID token, which needs the profile scope.",
    },
    {
      "q": "Is the Telegram user ID safe to store as a JavaScript number?",
      "a": "Yes. Telegram's Bot API docs say the ID has at most 52 significant bits, so a double-precision float, which is what a JavaScript Number is, stores it exactly.",
    },
  ]
---

# Getting a Telegram user ID in your app, and storing it safely

<p class="post-meta">By <a href="https://halit.org">Halit Sever</a> · <time datetime="2026-11-28">28 November 2026</time></p>

<p class="lead">Every Telegram account has a numeric user ID. Unlike the username, it never changes, which makes it the right key for your users table. Here is where it comes from in each way your app can meet a Telegram user, and one identifier that looks like it but is not.</p>

## What the ID is

The [Bot API's User object](https://core.telegram.org/bots/api#user) describes `id` as the unique identifier for a user or bot, and adds a warning: it may have more than 32 significant bits, so some languages have trouble with it, but it has at most 52 significant bits, so a 64-bit integer or a double-precision float is safe.

In practice:

- **JavaScript and TypeScript:** a `Number` is a double, so the ID fits exactly. nuxt-telegram-auth types it as `id: number`.
- **Databases:** use a 64-bit integer column (`BIGINT` in PostgreSQL and MySQL). A 32-bit `INT` will overflow for newer accounts.
- **Usernames** are optional and can change or be given up; they are not identifiers.

## From a bot

Every message or callback a bot receives has a `from` object with the sender's ID:

```json
{
  "update_id": 1,
  "message": {
    "from": { "id": 987654321, "is_bot": false, "first_name": "John", "username": "johndoe" },
    "chat": { "id": 987654321, "type": "private" },
    "text": "/start"
  }
}
```

In a private chat the chat ID equals the user ID. In groups they differ: `chat.id` is the group, `from.id` the person. [How to make a Telegram bot](https://projects.halit.org/advanced-telegram-economy/blog/how-to-make-a-telegram-bot.html) walks through a bot that reads updates like this.

## From Telegram Login on a website

With [Telegram Login](https://core.telegram.org/widgets/login), the OpenID Connect flow, the ID is the `id` claim of the ID token, and it is only included with the `profile` scope. Telegram's docs list `profile` as returning the user ID, name, username and photo. Plain `openid` gives you `sub`, `iss`, `iat` and `exp`, and no numeric ID.

nuxt-telegram-auth always adds `profile` to the scopes for that reason, and after validating the token copies `id` into the session:

```ts
// server/api/me.get.ts
export default defineEventHandler(async (event) => {
  const { user } = await requireTelegramSession(event);
  return { telegramId: user.id, name: user.first_name };
});
```

On the client, `useTelegramSession()` gives you the same `user.id`.

## sub is not the user ID

The ID token also has a `sub` claim, which looks like a long number. It is not the Telegram user ID. In Telegram's own example the two differ (`sub: "1234123412341234123"`, `id: 987654321`), and nuxt-telegram-auth's session type describes `sub` as opaque and different for every bot. If you key users on `sub`, the same person gets a different key in each of your bots. Key them on `id`.

Telegram also lets a bot sign its tokens with EdDSA or ES256K, and its docs restrict those algorithms to the `openid` scope. Tokens signed that way carry no `id`, so nuxt-telegram-auth refuses them and asks you to switch the bot back to RS256 or ES256 in BotFather.

## From the old login widget

The legacy widget sends signed fields to your callback, including `id`, `first_name`, `username`, `photo_url`, `auth_date` and `hash`. Once the hash is verified with your bot token, `id` is the same user ID. That is why nuxt-telegram-auth can move apps from the widget to Telegram Login without losing anyone: `user.id` is the same whichever way a person logs in. The widget sends numbers when it calls a JavaScript callback and strings in redirect mode, so the module accepts both and converts.

## Saving it

```ts
// server/plugins/telegram.ts
import { useServerHooks } from "nuxt/server";

export default () => {
  useServerHooks().hook("telegram-auth:login", async ({ user }) => {
    await db.users.upsert({ telegramId: user.id, name: user.first_name });
  });
};
```

[Saving Telegram users to a database](/blog/telegram-login-save-users) covers the hook in full, including refusing a login.

## FAQ

### What is a Telegram user ID?

A unique number Telegram assigns to every user and bot. It does not change when the user changes their name or username, so apps use it to recognise accounts.

### How do I get a user's Telegram ID in my app?

In a bot, read from.id on incoming messages. On a website, log the user in with Telegram Login and read the id claim of the validated ID token, which needs the profile scope.

### Is the Telegram user ID safe to store as a JavaScript number?

Yes. Telegram's Bot API docs say the ID has at most 52 significant bits, so a double-precision float, which is what a JavaScript Number is, stores it exactly.

## Related posts

- [Saving Telegram users to a database when they log in](/blog/telegram-login-save-users)
- [ID token or access token?](/blog/id-token-vs-access-token)
- [BotFather setup for Telegram Login](/blog/botfather-login-widget-setup)
- [Sessions and hooks](/sessions)
- [All posts](/blog/)
