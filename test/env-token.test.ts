import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import { createSessionCookie } from "./utils";

const ENV_TOKEN = "env_only_bot_token_67890";

describe("bot token from NUXT_TELEGRAM_TOKEN only", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/env-token", import.meta.url)),
    env: { NUXT_TELEGRAM_TOKEN: ENV_TOKEN },
  });

  it("validates a session signed with the env token", async () => {
    const result = await $fetch<Record<string, unknown>>("/api/telegram/session", {
      headers: { Cookie: `tg_user=${createSessionCookie({}, ENV_TOKEN)}` },
    });
    expect(result.loggedIn).toBe(true);
    expect(result.first_name).toBe("Test");
  });
});
