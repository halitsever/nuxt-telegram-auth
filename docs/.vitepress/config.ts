import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Nuxt Telegram Auth",
  description: "Effortlessly integrate the Telegram login widget into your Nuxt 3 application with our easy-to-use npm package, enhancing user authentication and engagement.",

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
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/halitsever/nuxt-telegram-auth" }],
  },
});
