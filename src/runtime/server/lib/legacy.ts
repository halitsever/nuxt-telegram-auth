import { createError, deleteCookie, getCookie } from "nuxt/server";
import type { RequestEvent } from "nuxt/server";
import { userFromWidgetData } from "../../shared/normalize";
import type { TelegramSession, TelegramUser } from "../../shared/types";
import { useTelegramConfig } from "./config";
import { completeLogin } from "./pipeline";
import { decodeAuthCookie, verifyTelegramAuthData, type TelegramAuthData } from "./verify";

/** The 1.x session cookie: Telegram's signed login data, not sealed. */
export const LEGACY_COOKIE = "tg_user";

interface VerifiedWidgetLogin {
  data: TelegramAuthData;
  user: TelegramUser;
}

function isAuthData(value: unknown): value is TelegramAuthData {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.values(value).every((field) => typeof field === "string" || typeof field === "number");
}

/** Telegram's signature plus an age limit: a signed login stays valid forever otherwise. */
async function verifyWidgetData(input: unknown, botToken: string, maxAge: number): Promise<VerifiedWidgetLogin | null> {
  if (!isAuthData(input)) return null;
  const age = Date.now() / 1000 - Number(input.auth_date);
  if (!(age <= maxAge) || !(await verifyTelegramAuthData(input, botToken))) return null;
  const user = userFromWidgetData(input);
  return user ? { data: input, user } : null;
}

function requireBotToken(): string {
  const { botToken } = useTelegramConfig();
  if (!botToken) throw createError({ status: 500, message: "Set NUXT_TELEGRAM_AUTH_BOT_TOKEN to use the legacy login widget." });
  return botToken;
}

export async function verifyWidgetPayload(payload: unknown): Promise<TelegramUser | null> {
  const verified = await verifyWidgetData(payload, requireBotToken(), useTelegramConfig().session.maxAge);
  return verified?.user ?? null;
}

export async function loginWithWidgetData(event: RequestEvent, input: unknown): Promise<TelegramSession | null> {
  const verified = await verifyWidgetData(input, requireBotToken(), useTelegramConfig().session.maxAge);
  if (!verified) return null;
  return completeLogin(event, { provider: "legacy", user: verified.user, claims: verified.data });
}

/** Turns a valid 1.x cookie into a sealed session that ends when the old one would have. The old cookie goes either way. */
export async function migrateLegacyCookie(event: RequestEvent): Promise<TelegramSession | null> {
  const value = getCookie(event, LEGACY_COOKIE);
  if (!value) return null;
  deleteCookie(event, LEGACY_COOKIE, { path: "/" });

  // Without a bot token (an app that moved to Telegram Login) the old cookie can't be checked, only dropped.
  const { botToken, session } = useTelegramConfig();
  if (!botToken) return null;
  const verified = await verifyWidgetData(decodeAuthCookie(value), botToken, session.maxAge);
  if (!verified) return null;
  return completeLogin(event, { provider: "legacy", user: verified.user, claims: verified.data }, { loggedInAt: Number(verified.data.auth_date) });
}
