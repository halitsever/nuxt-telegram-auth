import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { setup, $fetch, fetch, url } from "@nuxt/test-utils/e2e";
import { createSessionCookie, signAuthData } from "./utils";

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

  describe("POST /api/telegram/session", () => {
    const post = (body: unknown, headers: Record<string, string> = {}) =>
      fetch("/api/telegram/session", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
      });

    const sessionCookie = (response: Response) => response.headers.getSetCookie().find((value) => value.startsWith("tg_user="));

    it("sets an HttpOnly session cookie for a valid login", async () => {
      const response = await post(signAuthData());
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toMatchObject({ loggedIn: true, first_name: "Test" });
      expect(body).not.toHaveProperty("hash");
      expect(sessionCookie(response)).toMatch(/HttpOnly/);
      expect(sessionCookie(response)).toMatch(/SameSite=Lax/);
      expect(sessionCookie(response)).toMatch(/Path=\//);
    });

    it("creates a session that GET can read back", async () => {
      const response = await post(signAuthData({ first_name: "Ünal 🚀" }));
      const cookie = sessionCookie(response)?.split(";")[0];
      const result = await $fetch<Record<string, unknown>>("/api/telegram/session", { headers: { Cookie: cookie ?? "" } });
      expect(result).toMatchObject({ loggedIn: true, first_name: "Ünal 🚀" });
    });

    it("rejects a login with a bad hash", async () => {
      const response = await post({ ...signAuthData(), first_name: "Eve" });
      expect(response.status).toBe(401);
      expect(sessionCookie(response)).toBeUndefined();
    });

    it("rejects a login older than sessionMaxAge", async () => {
      const response = await post(signAuthData({ auth_date: Math.floor(Date.now() / 1000) - 86401 }));
      expect(response.status).toBe(401);
      expect(sessionCookie(response)).toBeUndefined();
    });

    it("rejects requests from another site", async () => {
      expect((await post(signAuthData(), { Origin: "https://evil.example" })).status).toBe(403);
      expect((await post(signAuthData(), { "Sec-Fetch-Site": "cross-site" })).status).toBe(403);
    });

    it("accepts requests from the same site", async () => {
      const sameSite: Record<string, string>[] = [{ Origin: new URL(url("/")).origin }, { "Sec-Fetch-Site": "same-origin" }];
      for (const headers of sameSite) {
        const response = await post(signAuthData(), headers);
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ loggedIn: true });
      }
    });

    it("rejects bodies that are not JSON", async () => {
      const response = await post("id=1", { "Content-Type": "application/x-www-form-urlencoded" });
      expect(response.status).toBe(415);
    });
  });

  describe("GET /api/telegram/callback", () => {
    const callback = (params: Record<string, string | number>) => {
      const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
      return fetch(`/api/telegram/callback?${query}`, { redirect: "manual" });
    };

    const sessionCookie = (response: Response) => response.headers.getSetCookie().find((value) => value.startsWith("tg_user="));

    it("logs in and redirects to the given path", async () => {
      const response = await callback({ redirect: "/dashboard", ...signAuthData() });
      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe("/dashboard");
      expect(response.headers.get("referrer-policy")).toBe("no-referrer");
      expect(sessionCookie(response)).toMatch(/HttpOnly/);
    });

    it("redirects to the home page when the target is on another site", async () => {
      const response = await callback({ redirect: "//evil.example", ...signAuthData() });
      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe("/");
    });

    it("keeps numeric fields as numbers in the session", async () => {
      const response = await callback(signAuthData());
      const cookie = sessionCookie(response)?.split(";")[0];
      const result = await $fetch<Record<string, unknown>>("/api/telegram/session", { headers: { Cookie: cookie ?? "" } });
      expect(result.id).toBe(123456789);
      expect(result.auth_date).toBeTypeOf("number");
    });

    it("rejects a login with a bad hash", async () => {
      const response = await callback({ ...signAuthData(), first_name: "Eve" });
      expect(response.status).toBe(401);
      expect(sessionCookie(response)).toBeUndefined();
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
