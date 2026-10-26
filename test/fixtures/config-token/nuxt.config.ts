import NuxtTelegramAuth from "../../../src/module";

export default defineNuxtConfig({
  modules: [NuxtTelegramAuth],
  runtimeConfig: {
    telegramAuth: {
      botToken: "config_bot_token_24680",
      sessionPassword: "test-session-password-of-32-chars-or-more",
    },
  },
});
