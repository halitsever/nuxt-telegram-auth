export default defineNuxtConfig({
  extends: ["../v2"],
  runtimeConfig: {
    telegramAuth: {
      sessionPassword: "",
    },
  },
});
