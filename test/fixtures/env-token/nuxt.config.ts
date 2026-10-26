import NuxtTelegramAuth from "../../../src/module";

export default defineNuxtConfig({
  modules: [NuxtTelegramAuth],
  runtimeConfig: {
    telegramAuth: {
      sessionPassword: "test-session-password-of-32-chars-or-more",
    },
  },
});
