import { defineNuxtPlugin } from "nuxt/app";
import { useTelegramSession } from "../composables/session";
import { isSharedRender } from "../utils/render";

export default defineNuxtPlugin({
  name: "nuxt-telegram-auth:session",
  async setup() {
    const session = useTelegramSession();
    if (import.meta.server) {
      // HTML that everyone gets can't carry one visitor's session; the browser loads its own instead.
      if (isSharedRender()) return;
      await session.fetch().catch((error) => console.error("[nuxt-telegram-auth] Could not load the session:", error));
    } else if (!session.ready.value) {
      session.fetch().catch(() => {});
    }
  },
});
