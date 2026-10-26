import { defineNuxtPlugin } from "nuxt/app";
import { useTelegramSession } from "../composables/session";

export default defineNuxtPlugin({
  name: "nuxt-telegram-auth:session",
  async setup() {
    const session = useTelegramSession();
    if (import.meta.server) {
      // A prerendered page is shared by everyone, so the browser loads its own session instead.
      if (import.meta.prerender) return;
      await session.fetch().catch((error) => console.error("[nuxt-telegram-auth] Could not load the session:", error));
    } else if (!session.ready.value) {
      session.fetch().catch(() => {});
    }
  },
});
