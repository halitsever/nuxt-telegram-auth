export default defineNuxtConfig({
  extends: ["../basic"],
  telegramAuth: {
    compat: { migrateLegacyCookie: false },
  },
});
