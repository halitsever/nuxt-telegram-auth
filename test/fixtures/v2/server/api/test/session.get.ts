import { defineEventHandler } from "nuxt/server";
import { readTelegramSession } from "../../../../../../src/runtime/server/lib/store";

export default defineEventHandler(async (event) => ({ session: await readTelegramSession(event) }));
