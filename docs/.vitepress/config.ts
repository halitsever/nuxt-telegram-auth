import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Nuxt Telegram Auth",
  description: "Telegram Login for Nuxt, with sessions checked and sealed on the server.",

  base: "/nuxt-telegram-auth/",

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Quick Start", link: "/installation" },
    ],

    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Quickstart", link: "/installation" },
          { text: "Telegram Login", link: "/telegram-login" },
          { text: "Sessions and hooks", link: "/sessions" },
          { text: "Page protection", link: "/pages" },
          { text: "Configuration", link: "/configuration" },
        ],
      },
      {
        text: "Legacy widget",
        items: [
          { text: "Login widget", link: "/properties" },
          { text: "Redirect mode", link: "/redirect-mode" },
        ],
      },
      {
        text: "Upgrading",
        items: [{ text: "Migrating from 1.x", link: "/migration" }],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/halitsever/nuxt-telegram-auth" }],
  },
});
