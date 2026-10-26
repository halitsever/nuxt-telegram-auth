import { defineEventHandler, readBody } from "nuxt/server";
import { openSealedCookie } from "../../../../../../src/runtime/server/lib/store";

export default defineEventHandler(async (event) => {
  const { name } = await readBody<{ name: string }>(event);
  await openSealedCookie<string>(event, { name, maxAge: 60 }).write("x");
  return { ok: true };
});
