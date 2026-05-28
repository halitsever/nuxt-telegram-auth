import { getCookie, createError } from "h3";
import { useRuntimeConfig } from "nitropack/runtime";
import * as crypto from "node:crypto";
import type { H3Event } from "h3";
import type { ITelegramSession } from "../../types/session";

// Validates the tg_user cookie and returns the session, or null if invalid/missing.
export async function getTelegramSession(event: H3Event): Promise<ITelegramSession | null> {
  const session = getCookie(event, "tg_user");
  if (!session) return null;

  let decodedCookie: Record<string, string>;
  try {
    decodedCookie = JSON.parse(Buffer.from(session, "base64").toString("utf-8"));
  } catch {
    return null;
  }

  const runtimeConfig = useRuntimeConfig(event);
  const sessionMaxAge = runtimeConfig.telegramAuth?.sessionMaxAge ?? 86400;

  if (Date.now() / 1000 - Number(decodedCookie.auth_date) > sessionMaxAge) return null;

  const telegramApiToken = runtimeConfig.TELEGRAM_TOKEN;
  if (!telegramApiToken) throw createError({ statusCode: 500, statusMessage: "Internal Server Error" });

  const secret = crypto.createHash("sha256").update(telegramApiToken).digest();
  const dataCheckString: string[] = [];
  for (const key in decodedCookie) {
    if (key !== "hash") dataCheckString.push(`${key}=${decodedCookie[key]}`);
  }

  const check_hash = crypto.createHmac("sha256", secret).update(dataCheckString.sort().join("\n")).digest("hex");

  const a = Buffer.from(check_hash, "hex");
  const b = Buffer.from(decodedCookie.hash ?? "", "hex");
  const hashValid = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!hashValid) return null;

  return { loggedIn: true, status: 200, ...decodedCookie } as unknown as ITelegramSession;
}

// Like getTelegramSession but throws 401 if session is missing or invalid.
export async function requireTelegramSession(event: H3Event): Promise<ITelegramSession> {
  const session = await getTelegramSession(event);
  if (!session) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  return session;
}
