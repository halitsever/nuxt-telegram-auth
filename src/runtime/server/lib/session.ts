import { createError, getRequestHeader, getRequestHost, setCookie } from "h3";
import { useRuntimeConfig } from "nitropack/runtime";
import type { H3Event } from "h3";
import type { ITelegramSession } from "../../types/session";
import { encodeAuthCookie, verifyTelegramAuthData, type TelegramAuthData } from "./verify";

export const SESSION_COOKIE = "tg_user";

export function getBotToken(event: H3Event): string {
  const config = useRuntimeConfig(event);
  const botToken = config.telegramAuth?.botToken || config.TELEGRAM_TOKEN;
  if (!botToken) throw createError({ statusCode: 500, statusMessage: "Internal Server Error" });
  return String(botToken);
}

export function getSessionMaxAge(event: H3Event): number {
  return useRuntimeConfig(event).telegramAuth?.sessionMaxAge ?? 86400;
}

export function toPublicSession(data: TelegramAuthData): ITelegramSession {
  const { hash: _hash, ...fields } = data;
  return { loggedIn: true, status: 200, ...fields } as unknown as ITelegramSession;
}

function isAuthData(value: unknown): value is TelegramAuthData {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.values(value).every((field) => typeof field === "string" || typeof field === "number");
}

/** Verifies a Telegram login and stores it in an HttpOnly cookie. Returns null for an invalid or expired login. */
export async function createTelegramSession(event: H3Event, input: unknown): Promise<ITelegramSession | null> {
  if (!isAuthData(input)) return null;

  const age = Date.now() / 1000 - Number(input.auth_date);
  const maxAge = getSessionMaxAge(event);
  if (!(age <= maxAge) || !(await verifyTelegramAuthData(input, getBotToken(event)))) return null;

  setCookie(event, SESSION_COOKIE, encodeAuthCookie(input), {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(maxAge - age),
  });
  return toPublicSession(input);
}

/** A login posted from another site could sign the visitor into the attacker's account. */
export function isCrossSiteRequest(event: H3Event): boolean {
  const fetchSite = getRequestHeader(event, "sec-fetch-site");
  if (fetchSite) return fetchSite !== "same-origin" && fetchSite !== "none";

  const origin = getRequestHeader(event, "origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== getRequestHost(event, { xForwardedHost: true });
  } catch {
    return true;
  }
}
