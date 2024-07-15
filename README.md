<p align="center" class="logo-section">
<img src="https://i.ibb.co/MMcBdPN/nuxt-telegram-auth.png" height="80" width="80"/>
</br>
<img src="https://halitsever-api.vercel.app/api/repo-title?title=Nuxt%20Telegram%20Auth">

<p align="center">
🔐 A telegram login widget integration for nuxt 3
<br>
<br/>
<br/>
<img src="https://img.shields.io/github/sponsors/halitsever"/>
</p>
<p align="center">
<a align="center" href="https://halitsever.github.io/nuxt-telegram-auth">Documentation</a>
  </p>
</p>

<a align="center">
<img src="https://halitsever-api.vercel.app/api/details"/>
</a>

- 🧑‍💻 [**Easy Integration**](#) - A telegram bot and this module enough for telegram login widget

  <a align="center" >
  <img src="https://halitsever-api.vercel.app/api/installation"/>
  </a>

Installation:

```bash
npx nuxi module add nuxt-telegram-auth
```

Then you need add TELEGRAM_TOKEN to your runtimeConfig:

```javascript
runtimeConfig: {
  TELEGRAM_TOKEN: "my_fancy_bot_token",
}
```

after that you can try on a page:

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

for more detailed information, please check the documentation page.

<a align="center" href="https://github.com/halitsever/nuxt-telegram-auth/issues">
<img src="https://halitsever-api.vercel.app/api/issue"/>
</a>

<a align="center">
<img src="https://halitsever-api.vercel.app/api/sponsor"/>
</a>

<a align="center">
<img src="https://halitsever-api.vercel.app/api/license"/>
</a>

<p align="center">
  MIT LICENSE | <a href="https://halit.org">Halit Sever</a>
</p>
