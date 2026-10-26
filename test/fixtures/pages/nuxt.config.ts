export default defineNuxtConfig({
  extends: ["../v2"],
  routeRules: {
    "/cached": { swr: 60 },
    "/cached-private": { swr: 60 },
    "/prerendered": { prerender: true },
  },
});
