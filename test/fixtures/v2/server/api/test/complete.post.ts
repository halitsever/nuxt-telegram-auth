import { defineEventHandler, readBody } from "nuxt/server";
import type { TelegramUser } from "../../../../../../src/runtime/shared/types";
import { completeLogin } from "../../../../../../src/runtime/server/lib/pipeline";

export default defineEventHandler(async (event) => {
  const { user } = await readBody<{ user: TelegramUser }>(event);
  return completeLogin(event, { provider: "legacy", user, claims: {} });
});
