export default defineNuxtConfig({
  modules: ["../src/module"],
  devtools: { enabled: true },
  compatibilityDate: "2025-05-26",
  runtimeConfig: {
    TELEGRAM_TOKEN: "my_fancy_bot_token",
  },
});
