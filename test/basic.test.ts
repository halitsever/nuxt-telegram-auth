import { fileURLToPath } from "node:url";
import * as crypto from "node:crypto";
import { describe, it, expect } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";

const TEST_TOKEN = "test_bot_token_12345";

function createSessionCookie(overrides: Record<string, string | number> = {}) {
  const userData: Record<string, string | number> = {
    id: 123456789,
    first_name: "Test",
    username: "testuser",
    auth_date: Math.floor(Date.now() / 1000),
    ...overrides,
  };

  const secret = crypto.createHash("sha256").update(TEST_TOKEN).digest();
  const dataCheckString = Object.keys(userData)
    .sort()
    .map((key) => `${key}=${userData[key]}`)
    .join("\n");

  const hash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  return Buffer.from(JSON.stringify({ ...userData, hash })).toString("base64");
}

describe("ssr", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/basic", import.meta.url)),
  });

  it("renders the index page", async () => {
    const html = await $fetch("/");
    expect(html).toContain("<div>basic</div>");
  });

  describe("GET /api/telegram/session", () => {
    it("returns 401 when no cookie is present", async () => {
      const result = await $fetch("/api/telegram/session");
      expect(result.loggedIn).toBe(false);
      expect(result.status).toBe(401);
    });

    it("returns loggedIn: true with a valid session cookie", async () => {
      const result = await $fetch<Record<string, unknown>>("/api/telegram/session", {
        headers: { Cookie: `tg_user=${createSessionCookie()}` },
      });
      expect(result.loggedIn).toBe(true);
      expect(result.first_name).toBe("Test");
    });

    it("returns loggedIn: false when hash is invalid", async () => {
      const tampered = Buffer.from(
        JSON.stringify({
          id: 123456789,
          first_name: "Test",
          username: "testuser",
          auth_date: Math.floor(Date.now() / 1000),
          hash: "000000000000000000000000000000000000000000000000000000000000000",
        })
      ).toString("base64");

      const result = await $fetch("/api/telegram/session", {
        headers: { Cookie: `tg_user=${tampered}` },
      });
      expect(result.loggedIn).toBe(false);
    });

    it("returns 401 when session is expired", async () => {
      const cookie = createSessionCookie({
        auth_date: Math.floor(Date.now() / 1000) - 86401,
      });
      const result = await $fetch("/api/telegram/session", {
        headers: { Cookie: `tg_user=${cookie}` },
      });
      expect(result.loggedIn).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  describe("DELETE /api/telegram/session", () => {
    it("returns 200 and clears the session", async () => {
      const result = await $fetch("/api/telegram/session", { method: "DELETE" });
      expect(result.status).toBe(200);
    });
  });
});
