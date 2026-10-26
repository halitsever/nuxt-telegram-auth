// Copy .env.example to .env and fill in your test bot's values.
export default defineNuxtConfig({
  modules: ["../src/module"],
  devtools: { enabled: true },
  compatibilityDate: "2025-05-26",
  runtimeConfig: {
    public: {
      // Only the old widget needs the bot's username.
      botUsername: "",
    },
  },
  // Telegram needs a public HTTPS address, so local testing goes through a cloudflared tunnel.
  vite: {
    server: {
      allowedHosts: [".trycloudflare.com"],
    },
  },
});
