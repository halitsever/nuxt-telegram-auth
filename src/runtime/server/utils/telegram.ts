import { createError } from "nuxt/server";
import type { RequestEvent } from "nuxt/server";
import type { TelegramSession, TelegramUser } from "../../shared/types";
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

/** Checks a legacy widget payload (signature and age) without logging anyone in. */
export function verifyTelegramWidgetPayload(payload: unknown): Promise<TelegramUser | null> {
  return verifyWidgetPayload(payload);
}
