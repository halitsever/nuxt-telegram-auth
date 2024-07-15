export default defineNuxtConfig({
  modules: ["../src/module"],
  devtools: { enabled: true },
  runtimeConfig: {
    TELEGRAM_TOKEN: "my_fancy_bot_token",
  },
});
