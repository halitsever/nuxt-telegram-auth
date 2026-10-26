// The client id and Telegram's endpoints come from the test's env, pointing at test/support/oidc-provider.ts.
export default defineNuxtConfig({
  extends: ["../v2"],
  // Strict on purpose: the redirect login has to work with it.
  telegramAuth: {
    session: { cookie: { sameSite: "strict" } },
  },
  runtimeConfig: {
    telegramAuth: {
      clientSecret: "test-secret",
    },
  },
});
