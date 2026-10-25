import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import { createSessionCookie } from "./utils";

describe("bot token from runtimeConfig.telegramAuth.botToken", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/config-token", import.meta.url)),
  });

  it("validates a session signed with the configured token", async () => {
    const result = await $fetch<Record<string, unknown>>("/api/telegram/session", {
      headers: { Cookie: `tg_user=${createSessionCookie({}, "config_bot_token_24680")}` },
    });
    expect(result.loggedIn).toBe(true);
  });
});
