import { defineEventHandler, isNuxtError, useServerHooks } from "nuxt/server";
import type { TelegramSessionResponse } from "../../../shared/types";
import type { TelegramSessionHookContext } from "../../hooks";
import { useTelegramConfig } from "../../lib/config";
import { migrateLegacyCookie } from "../../lib/legacy";
import { reportLoginError } from "../../lib/pipeline";
import { noStore } from "../../lib/request";
import { readTelegramSession } from "../../lib/store";

async function migrate(event: Parameters<typeof migrateLegacyCookie>[0]) {
  try {
    return await migrateLegacyCookie(event);
  } catch (error) {
    // A login hook may refuse a migrated user like any other; that's a logged-out answer, not a failure.
    if (isNuxtError(error) && error.status === 403) return null;
    throw error;
  }
}

export default defineEventHandler(async (event): Promise<TelegramSessionResponse> => {
  noStore(event);
  const session = (await readTelegramSession(event)) ?? (useTelegramConfig().migrateLegacyCookie ? await migrate(event) : null);
  if (!session) return { loggedIn: false };

  const ctx: TelegramSessionHookContext = { event, session };
  try {
    await useServerHooks().callHook("telegram-auth:session", ctx);
  } catch (error) {
    await reportLoginError(event, "session", error);
    throw error;
  }
  return { loggedIn: true, ...ctx.session };
});
