import NuxtTelegramAuth from "../../../src/module";

export default defineNuxtConfig({
  modules: [NuxtTelegramAuth],
  runtimeConfig: {
    TELEGRAM_TOKEN: "test_bot_token_12345",
  },
});
