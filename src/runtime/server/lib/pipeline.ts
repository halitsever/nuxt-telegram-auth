import { useServerHooks } from "nuxt/server";
import type { RequestEvent } from "nuxt/server";
import type { TelegramProvider, TelegramSession, TelegramUser } from "../../shared/types";
import type { TelegramLoginHookContext } from "../hooks";
import { writeTelegramSession } from "./store";

export interface VerifiedLogin {
  provider: TelegramProvider;
  user: TelegramUser;
  claims: Record<string, unknown>;
  sub?: string;
}

/** Every login method ends here, so hooks and the session look the same whichever one was used. */
export async function completeLogin(event: RequestEvent, login: VerifiedLogin, options: { loggedInAt?: number } = {}): Promise<TelegramSession> {
  const ctx: TelegramLoginHookContext = { event, provider: login.provider, user: login.user, claims: login.claims, session: { data: {} } };
  try {
    // Hooks run before the write, so a denied login never touches the cookie.
    await useServerHooks().callHook("telegram-auth:login", ctx);
    const session: TelegramSession = { user: ctx.user, provider: login.provider, loggedInAt: options.loggedInAt ?? Math.floor(Date.now() / 1000) };
    if (login.sub) session.sub = login.sub;
    if (Object.keys(ctx.session.data).length > 0) session.data = ctx.session.data;
    await writeTelegramSession(event, session);
    return session;
  } catch (error) {
    await reportLoginError(event, login.provider, error);
    throw error;
  }
}

/** Errors the error hook already saw, so a caller that rethrows one can report it again safely. */
const reported = new WeakSet<object>();

export async function reportLoginError(event: RequestEvent, provider: TelegramProvider | "session", error: unknown): Promise<void> {
  if (typeof error === "object" && error !== null) {
    if (reported.has(error)) return;
    reported.add(error);
  }
  try {
    await useServerHooks().callHook("telegram-auth:error", { event, provider, error });
  } catch (hookError) {
    // A broken error hook must not hide the original failure.
    console.error("[nuxt-telegram-auth] telegram-auth:error hook failed:", hookError);
  }
}
