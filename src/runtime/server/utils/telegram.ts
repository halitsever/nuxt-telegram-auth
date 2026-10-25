import { getCookie, createError } from "h3";
import type { H3Event } from "h3";
import type { ITelegramSession } from "../../types/session";
import { getBotToken, getSessionMaxAge, SESSION_COOKIE } from "../lib/session";
import { decodeAuthCookie, verifyTelegramAuthData } from "../lib/verify";

// Validates the tg_user cookie and returns the session, or null if invalid/missing.
export async function getTelegramSession(event: H3Event): Promise<ITelegramSession | null> {
  const cookie = getCookie(event, SESSION_COOKIE);
  const data = cookie ? decodeAuthCookie(cookie) : null;
  if (!data) return null;

  if (Date.now() / 1000 - Number(data.auth_date) > getSessionMaxAge(event)) return null;

  if (!(await verifyTelegramAuthData(data, getBotToken(event)))) return null;

  return { loggedIn: true, status: 200, ...data } as unknown as ITelegramSession;
}

// Like getTelegramSession but throws 401 if session is missing or invalid.
export async function requireTelegramSession(event: H3Event): Promise<ITelegramSession> {
  const session = await getTelegramSession(event);
  if (!session) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  return session;
}
