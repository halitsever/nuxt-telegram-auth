import { defineConfig } from "vitepress";

const siteUrl = "https://halitsever.github.io/nuxt-telegram-auth/";
const title = "Nuxt Telegram Auth";
const description = "Telegram Login for Nuxt, with sessions checked and sealed on the server.";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  name: "nuxt-telegram-auth",
  description,
  url: siteUrl,
  codeRepository: "https://github.com/halitsever/nuxt-telegram-auth",
  programmingLanguage: "TypeScript",
  runtimePlatform: "Nuxt",
  license: "https://opensource.org/licenses/MIT",
  author: { "@type": "Person", name: "Halit Sever", url: "https://halit.org" },
};

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: "en-US",
  title,
  description,

  base: "/nuxt-telegram-auth/",

  sitemap: { hostname: siteUrl },

  head: [
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: title }],
    ["meta", { property: "og:description", content: description }],
    ["meta", { property: "og:image", content: `${siteUrl}og.png` }],
    ["meta", { property: "og:image:width", content: "1280" }],
    ["meta", { property: "og:image:height", content: "640" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["script", { type: "application/ld+json" }, JSON.stringify(jsonLd)],
  ],

  transformPageData(pageData) {
    if (pageData.isNotFound) return;
    const path = pageData.relativePath.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, ".html");
    const url = `${siteUrl}${path}`;
    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(["link", { rel: "canonical", href: url }], ["meta", { property: "og:url", content: url }]);
  },

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
