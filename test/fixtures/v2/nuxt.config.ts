import NuxtTelegramAuth from "../../../src/module";

export default defineNuxtConfig({
  modules: [NuxtTelegramAuth],
  runtimeConfig: {
    telegramAuth: {
      botToken: "test_bot_token_12345",
      sessionPassword: "test-session-password-of-32-chars-or-more",
    },
  },
  // The compat-5 CI job builds the fixtures for Nuxt 5.
  future: { compatibilityVersion: process.env.NUXT_TEST_COMPAT === "5" ? 5 : 4 },
});
