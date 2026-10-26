import { describe, expect, it } from "vitest";
import { resolveTelegramConfig } from "../../src/runtime/server/lib/config";
import { resolveSessionPassword } from "../../src/runtime/server/lib/store";

const config = resolveTelegramConfig({});

describe("resolveSessionPassword", () => {
  it("uses a session password of 32 characters or more", async () => {
    expect(await resolveSessionPassword({ ...config, sessionPassword: "p".repeat(32) })).toBe("p".repeat(32));
  });

  it("refuses a shorter session password with the secret message", async () => {
    await expect(resolveSessionPassword({ ...config, sessionPassword: "short" })).rejects.toMatchObject({
      message: "Set NUXT_APP_SECRET (at least 32 characters, e.g. `openssl rand -base64 32`) or NUXT_TELEGRAM_AUTH_SESSION_PASSWORD.",
    });
  });
});
