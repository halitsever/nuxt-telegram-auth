import type { RequestEvent, ServerHookResult } from "nuxt/server";
import type { TelegramProvider, TelegramSession, TelegramUser } from "../shared/types";

/** Change `user` or `session.data`, or throw (e.g. `createError({ status: 403 })`) to deny the login. */
export interface TelegramLoginHookContext {
  event: RequestEvent;
  provider: TelegramProvider;
  user: TelegramUser;
  claims: Record<string, unknown>;
  session: { data: Record<string, unknown> };
}

/** Changes to `session` go into the response, not the cookie. */
export interface TelegramSessionHookContext {
  event: RequestEvent;
  session: TelegramSession;
}

export interface TelegramLogoutHookContext {
  event: RequestEvent;
  session: TelegramSession;
}

export interface TelegramErrorHookContext {
  event: RequestEvent;
  provider: TelegramProvider | "session";
  error: unknown;
}

declare module "nuxt/schema" {
  interface NuxtServerHooks {
    "telegram-auth:login": (ctx: TelegramLoginHookContext) => ServerHookResult;
    "telegram-auth:session": (ctx: TelegramSessionHookContext) => ServerHookResult;
    "telegram-auth:logout": (ctx: TelegramLogoutHookContext) => ServerHookResult;
    "telegram-auth:error": (ctx: TelegramErrorHookContext) => ServerHookResult;
  }
}
