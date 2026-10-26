// The client id and Telegram's endpoints come from the test's env, pointing at test/support/oidc-provider.ts.
export default defineNuxtConfig({
  extends: ["../v2"],
  runtimeConfig: {
    telegramAuth: {
      clientSecret: "test-secret",
    },
  },
});
