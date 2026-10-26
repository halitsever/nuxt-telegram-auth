import { createError } from "nuxt/server";
import type { RequestEvent } from "nuxt/server";
import type { TelegramSession, TelegramUser } from "../../shared/types";
import { useTelegramConfig } from "../lib/config";
import { verifyIdToken } from "../lib/jwt";
import { verifyWidgetPayload } from "../lib/legacy";
import { deleteTelegramSession, readTelegramSession } from "../lib/store";

export function getTelegramSession(event: RequestEvent): Promise<TelegramSession | null> {
  return readTelegramSession(event);
}

export async function requireTelegramSession(event: RequestEvent): Promise<TelegramSession> {
  const session = await getTelegramSession(event);
  if (!session) throw createError({ status: 401, statusText: "Unauthorized" });
  return session;
}

export function clearTelegramSession(event: RequestEvent): Promise<void> {
  return deleteTelegramSession(event);
}

/** Checks a Telegram Login id_token against Telegram's keys and the configured client id, without logging anyone in. */
export function verifyTelegramIdToken(idToken: string, options: { nonce?: string } = {}): Promise<Record<string, unknown>> {
  return verifyIdToken(idToken, { config: useTelegramConfig(), nonce: options.nonce });
}

/** Checks a legacy widget payload (signature and age) without logging anyone in. */
export function verifyTelegramWidgetPayload(payload: unknown): Promise<TelegramUser | null> {
  return verifyWidgetPayload(payload);
}
