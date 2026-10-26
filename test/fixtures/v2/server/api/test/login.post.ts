import { defineEventHandler, readBody } from "nuxt/server";
import type { TelegramSession } from "../../../../../../src/runtime/shared/types";
import { writeTelegramSession } from "../../../../../../src/runtime/server/lib/store";

export default defineEventHandler(async (event) => {
  await writeTelegramSession(event, await readBody<TelegramSession>(event));
  return { ok: true };
});
