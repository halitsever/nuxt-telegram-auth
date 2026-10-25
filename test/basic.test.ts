import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { setup, $fetch, fetch } from "@nuxt/test-utils/e2e";
import { createSessionCookie } from "./utils";

describe("ssr", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/basic", import.meta.url)),
  });

  it("renders the index page", async () => {
    const html = await $fetch("/");
    expect(html).toContain("<div>basic</div>");
  });

  describe("useUserSession() during SSR", () => {
    it("renders the logged out state without a cookie", async () => {
      const html = await $fetch("/");
      expect(html).toContain('<p id="session-state">logged out</p>');
    });

    it("renders the user when the request carries a valid cookie", async () => {
      const html = await $fetch("/", {
        headers: { Cookie: `tg_user=${createSessionCookie()}` },
      });
      expect(html).toContain('<p id="session-state">logged in as Test</p>');
    });
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

    it("marks the response as private and uncacheable", async () => {
      const response = await fetch("/api/telegram/session", {
        headers: { Cookie: `tg_user=${createSessionCookie()}` },
      });
      expect(response.headers.get("cache-control")).toBe("private, no-store");
    });

    it("leaves the hash out of the response", async () => {
      const result = await $fetch<Record<string, unknown>>("/api/telegram/session", {
        headers: { Cookie: `tg_user=${createSessionCookie()}` },
      });
      expect(result).not.toHaveProperty("hash");
    });

    it("returns loggedIn: false when hash is invalid", async () => {
      const tampered = Buffer.from(
        JSON.stringify({
          id: 123456789,
          first_name: "Test",
          username: "testuser",
          auth_date: Math.floor(Date.now() / 1000),
          hash: "000000000000000000000000000000000000000000000000000000000000000",
        }),
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

    it("returns loggedIn: false when auth_date is missing", async () => {
      const result = await $fetch("/api/telegram/session", {
        headers: { Cookie: `tg_user=${createSessionCookie({ auth_date: undefined })}` },
      });
      expect(result.loggedIn).toBe(false);
    });

    it("reads names outside the Latin-1 range", async () => {
      const result = await $fetch<Record<string, unknown>>("/api/telegram/session", {
        headers: { Cookie: `tg_user=${createSessionCookie({ first_name: "Ünal 🚀" })}` },
      });
      expect(result.first_name).toBe("Ünal 🚀");
    });
  });

  describe("DELETE /api/telegram/session", () => {
    it("returns 200 and clears the session", async () => {
      const result = await $fetch("/api/telegram/session", { method: "DELETE" });
      expect(result.status).toBe(200);
    });

    it("expires the session cookie for the whole site", async () => {
      const response = await fetch("/api/telegram/session", { method: "DELETE" });
      const cookie = response.headers.getSetCookie().find((value) => value.startsWith("tg_user="));
      expect(cookie).toMatch(/Max-Age=0/);
      expect(cookie).toMatch(/Path=\//);
    });
  });
});
