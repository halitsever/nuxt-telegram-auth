# Installation

First of all you need a telegram bot, if you don't know to how to create a telegram bot please check this <a href="https://core.telegram.org/bots#how-do-i-create-a-bot">link</a>.

# Step 1:

Install the module:

```bash
npx nuxi module add nuxt-telegram-auth
```

# Step 2:

You need grab bot token from telegram, you can get your bot's token from Bot_Father:
<img src="/telegram-token.png"/>

Then add your nuxt.config.ts file:

```javascript
runtimeConfig: {
  TELEGRAM_TOKEN: "my_fancy_bot_token",
}
```

also you need allow your domain on Bot_Father otherwise you will get "Invalid Domain" error.

<img src="/domain.png"/>

After that you can use `TelegramLoginWidget` component:

```javascript
<template>
  <div>
    <div>
      <div v-if="session.loggedIn">
        <NuxtLink @click="logout" to="/">Logout</NuxtLink>
        <a>Hey you are logged in!</a>
        <p>Session: {{ session }}</p>
      </div>
      <div v-else>
        <TelegramLoginWidget telegram-login="my_bot" @callback="testCallback" />
      </div>
    </div>
  </div>
</template>

<script setup>
const { clearSession, session } = useUserSession();
const logout = () => clearSession();
const testCallback = (user) => {
  console.log("Custom callback function: ",user);
};
</script>
```

`telegram-login` value should be your bot's name.

`@callback` emit is optional.
