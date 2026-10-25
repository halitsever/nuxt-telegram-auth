import { getCookie, createError } from "h3";
import { useRuntimeConfig } from "nitropack/runtime";
import type { H3Event } from "h3";
import type { ITelegramSession } from "../../types/session";
import { decodeAuthCookie, verifyTelegramAuthData } from "../lib/verify";

// Validates the tg_user cookie and returns the session, or null if invalid/missing.
export async function getTelegramSession(event: H3Event): Promise<ITelegramSession | null> {
  const cookie = getCookie(event, "tg_user");
  const data = cookie ? decodeAuthCookie(cookie) : null;
  if (!data) return null;

  const runtimeConfig = useRuntimeConfig(event);
  const sessionMaxAge = runtimeConfig.telegramAuth?.sessionMaxAge ?? 86400;

  if (Date.now() / 1000 - Number(data.auth_date) > sessionMaxAge) return null;

  const telegramApiToken = runtimeConfig.TELEGRAM_TOKEN;
  if (!telegramApiToken) throw createError({ statusCode: 500, statusMessage: "Internal Server Error" });

  if (!(await verifyTelegramAuthData(data, String(telegramApiToken)))) return null;

  return { loggedIn: true, status: 200, ...data } as unknown as ITelegramSession;
}

// Like getTelegramSession but throws 401 if session is missing or invalid.
export async function requireTelegramSession(event: H3Event): Promise<ITelegramSession> {
  const session = await getTelegramSession(event);
  if (!session) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  return session;
}
