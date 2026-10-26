import { createError, useServerHooks } from "nuxt/server";
import { hookCalls } from "../hook-calls";

// A plain function, so the plugin also loads without Nitro's auto-imports (Nuxt 5).
export default () => {
  const hooks = useServerHooks();

  hooks.hook("telegram-auth:login", (ctx) => {
    hookCalls.push({ hook: "login", provider: ctx.provider, userId: ctx.user.id });
    if (ctx.user.id === 13) throw createError({ status: 403 });
    if (ctx.user.id === 42) ctx.session.data.role = "admin";
  });

  hooks.hook("telegram-auth:session", (ctx) => {
    hookCalls.push({ hook: "session", userId: ctx.session.user.id });
  });

  hooks.hook("telegram-auth:logout", (ctx) => {
    hookCalls.push({ hook: "logout", userId: ctx.session.user.id });
  });

  hooks.hook("telegram-auth:error", ({ provider, error }) => {
    const { status, code } = error as { status?: number; code?: string };
    hookCalls.push({ hook: "error", provider, status, code });
  });
};
