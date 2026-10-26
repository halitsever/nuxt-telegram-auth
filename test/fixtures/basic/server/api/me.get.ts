import { defineEventHandler } from "nuxt/server";

export default defineEventHandler(async (event) => (await requireTelegramSession(event)).user);
