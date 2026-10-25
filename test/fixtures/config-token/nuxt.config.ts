import NuxtTelegramAuth from "../../../src/module";

export default defineNuxtConfig({
  modules: [NuxtTelegramAuth],
  runtimeConfig: {
    telegramAuth: {
      botToken: "config_bot_token_24680",
    },
  },
});
