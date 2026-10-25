import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Nuxt Telegram Auth",
  description: "Telegram login widget integration for Nuxt, with sessions checked on the server.",

  base: "/nuxt-telegram-auth/",

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Quick Start", link: "/installation" },
    ],

    sidebar: [
      {
        text: "Documentation",
        items: [
          { text: "Quickstart", link: "/installation" },
          { text: "Properties", link: "/properties" },
          { text: "Configuration", link: "/configuration" },
          { text: "Redirect mode", link: "/redirect-mode" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/halitsever/nuxt-telegram-auth" }],
  },
});
