import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from "nuxt/app";
import { DEFAULT_LOGIN_PATH, DEFAULT_REDIRECT_AFTER_LOGIN } from "../../shared/defaults";
import { useTelegramSession } from "../composables/session";
import { decideAuthRedirect } from "../utils/guard";
import { isSharedRender } from "../utils/render";

/** Guards pages for the UI only; server routes still need requireTelegramSession. */
export default defineNuxtRouteMiddleware(async (to) => {
  // A redirect in shared HTML would apply to every visitor; the browser decides after loading its own session.
  if (import.meta.server && isSharedRender()) return;
  const session = useTelegramSession();
  // On the server the session plugin has already fetched; in the browser the first navigation may come first.
  if (import.meta.client && !session.ready.value) await session.fetch().catch(() => {});

  const telegramAuth = (useRuntimeConfig().public.telegramAuth ?? {}) as { loginPath?: string; redirectAfterLogin?: string; protectAll?: boolean };
  const target = decideAuthRedirect({ path: to.path, fullPath: to.fullPath, meta: to.meta as { telegramAuth?: boolean | "guest" } }, session.loggedIn.value, {
    loginPath: telegramAuth.loginPath || DEFAULT_LOGIN_PATH,
    redirectAfterLogin: telegramAuth.redirectAfterLogin || DEFAULT_REDIRECT_AFTER_LOGIN,
    protectAll: !!telegramAuth.protectAll,
  });
  if (target) return navigateTo(target);
});
