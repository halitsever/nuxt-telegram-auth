import { defineConfig } from "vitepress";

const siteUrl = "https://projects.halit.org/nuxt-telegram-auth/";
const title = "Nuxt Telegram Auth";
const description = "Telegram login for Nuxt: the login button, the OAuth redirect and the classic login widget, with sessions checked and sealed on the server.";

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

const person = { "@type": "Person", name: "Halit Sever", url: "https://halit.org" };

/** BlogPosting and breadcrumbs for posts, FAQPage for any page that shows its FAQ. */
function pageJsonLd(fm: Record<string, any>, url: string) {
  const graph: object[] = [];
  if (fm.date) {
    graph.push(
      {
        "@type": "BlogPosting",
        headline: fm.headline ?? fm.title,
        description: fm.description,
        url,
        mainEntityOfPage: url,
        datePublished: fm.date,
        dateModified: fm.date,
        inLanguage: "en",
        image: `${siteUrl}og.png`,
        keywords: fm.keyword,
        author: person,
        publisher: person,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: title, item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}blog/` },
          { "@type": "ListItem", position: 3, name: fm.headline ?? fm.title, item: url },
        ],
      },
    );
  }
  if (fm.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: fm.faq.map((f: { q: string; a: string }) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a.replace(/<[^>]+>|`/g, "") },
      })),
    });
  }
  return graph.length ? { "@context": "https://schema.org", "@graph": graph } : null;
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  /** keeps the page hash map out of every page's HTML, which Semrush reads as a low text-to-HTML ratio */
  metaChunk: true,
  lang: "en-US",
  title,
  description,

  base: "/nuxt-telegram-auth/",

  sitemap: { hostname: siteUrl },

  head: [
    /** Cloudflare Web Analytics, one token for every page on projects.halit.org. */
    ["script", { defer: "", src: "https://static.cloudflareinsights.com/beacon.min.js", "data-cf-beacon": '{"token": "dd7e54d3f48841c187d72d9dbb92a6b6"}' }],
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
    const fm = pageData.frontmatter;
    const pageTitle = fm.titleTemplate === false ? fm.title : `${pageData.title} | ${title}`;
    fm.head ??= [];
    fm.head.push(
      ["link", { rel: "canonical", href: url }],
      ["meta", { property: "og:url", content: url }],
      ["meta", { property: "og:type", content: fm.date ? "article" : "website" }],
      ["meta", { property: "og:title", content: pageTitle }],
      ["meta", { property: "og:description", content: fm.description ?? description }],
    );
    const ld = pageJsonLd(fm, url);
    if (ld) fm.head.push(["script", { type: "application/ld+json" }, JSON.stringify(ld)]);
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Quick Start", link: "/installation" },
      { text: "Widget generator", link: "/telegram-login-widget/" },
      { text: "Blog", link: "/blog/", activeMatch: "^/blog/" },
    ],

    sidebar: {
      "/blog/": [
        {
          text: "Guides",
          items: [
            { text: "All posts", link: "/blog/" },
            { text: "Mini App vs login widget", link: "/blog/telegram-mini-app-vs-login-widget" },
            { text: "nuxt-auth-utils compared", link: "/blog/nuxt-auth-utils-vs-nuxt-telegram-auth" },
            { text: "Nuxt auth options", link: "/blog/nuxt-authentication-options" },
            { text: "Auth middleware", link: "/blog/nuxt-auth-middleware" },
            { text: "Sealed cookies vs JWT", link: "/blog/nuxt-sealed-cookies-vs-jwt" },
            { text: "Login verification", link: "/blog/telegram-login-verification" },
            { text: "Save users on login", link: "/blog/telegram-login-save-users" },
            { text: "BotFather setup", link: "/blog/botfather-login-widget-setup" },
            { text: "What is PKCE", link: "/blog/what-is-pkce" },
            { text: "JWKS explained", link: "/blog/what-is-jwks" },
            { text: "HttpOnly cookies", link: "/blog/httponly-cookie" },
            { text: "SameSite Lax vs Strict", link: "/blog/samesite-cookie-lax" },
            { text: "ID token vs access token", link: "/blog/id-token-vs-access-token" },
            { text: "Telegram user ID", link: "/blog/telegram-user-id" },
          ],
        },
        {
          text: "Docs",
          items: [
            { text: "Quickstart", link: "/installation" },
            { text: "Widget generator", link: "/telegram-login-widget/" },
          ],
        },
      ],
      "/": [
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
            { text: "Legacy widget options", link: "/properties" },
            { text: "Redirect mode", link: "/redirect-mode" },
          ],
        },
        {
          text: "Upgrading",
          items: [{ text: "Migrating from 1.x", link: "/migration" }],
        },
        {
          text: "Tools and guides",
          items: [
            { text: "Widget generator", link: "/telegram-login-widget/" },
            { text: "Blog", link: "/blog/" },
          ],
        },
      ],
    },

    socialLinks: [{ icon: "github", link: "https://github.com/halitsever/nuxt-telegram-auth" }],
  },
});
