import { defineEventHandler, deleteCookie, getCookie, useServerHooks } from "nuxt/server";
import type { TelegramSessionResponse } from "../../../shared/types";
import { LEGACY_COOKIE } from "../../lib/legacy";
import { noStore } from "../../lib/request";
import { deleteTelegramSession, readTelegramSession } from "../../lib/store";

export default defineEventHandler(async (event): Promise<TelegramSessionResponse> => {
  noStore(event);
  const session = await readTelegramSession(event).catch(() => null);
  await deleteTelegramSession(event);
  // A leftover 1.x cookie would let the next GET migrate the user straight back in.
  if (getCookie(event, LEGACY_COOKIE)) deleteCookie(event, LEGACY_COOKIE, { path: "/" });
  if (session) await useServerHooks().callHook("telegram-auth:logout", { event, session });
  return { loggedIn: false };
});
