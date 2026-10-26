import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { setup, $fetch, fetch, url } from "@nuxt/test-utils/e2e";
import { cookieMaxAge, createSessionCookie, findSetCookie, signAuthData, toCookieHeader } from "./utils";

const now = () => Math.floor(Date.now() / 1000);
const SESSION = "nuxt-telegram-auth";

type SessionBody = { loggedIn: boolean; user: { id: number; first_name?: string } };

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

    it("renders the user when the request carries a valid 1.x cookie", async () => {
      const html = await $fetch("/", {
        headers: { Cookie: `tg_user=${createSessionCookie()}` },
      });
      expect(html).toContain('<p id="session-state">logged in as Test</p>');
    });
  });

  describe("GET /api/telegram/session", () => {
    const get = (cookie = "") => fetch("/api/telegram/session", { headers: { cookie } });

    it("answers GET without a session with loggedIn false, no cookie and no-store", async () => {
      const res = await get();
      expect(await res.json()).toEqual({ loggedIn: false });
      expect(res.headers.getSetCookie()).toEqual([]);
      expect(res.headers.get("cache-control")).toBe("private, no-store");
    });

    it("migrates a valid tg_user cookie, keeps its expiry and deletes it", async () => {
      const authDate = now() - 3600;
      const res = await get(`tg_user=${createSessionCookie({ auth_date: authDate })}`);
      expect(await res.json()).toMatchObject({ loggedIn: true, provider: "legacy", user: { id: 123456789, first_name: "Test" }, loggedInAt: authDate });
      expect(findSetCookie(res, "tg_user")).toMatch(/^tg_user=; Max-Age=0; Path=\//);
      expect(cookieMaxAge(findSetCookie(res, SESSION)!)).toBeCloseTo(82800, -1);
    });

    it.each([
      ["expired", createSessionCookie({ auth_date: now() - 86401 })],
      ["tampered", Buffer.from(JSON.stringify({ ...signAuthData(), first_name: "Eve" })).toString("base64")],
      ["dateless", createSessionCookie({ auth_date: undefined })],
    ])("ignores a %s tg_user cookie and deletes it", async (_, value) => {
      const res = await get(`tg_user=${value}`);
      expect(await res.json()).toEqual({ loggedIn: false });
      expect(findSetCookie(res, "tg_user")).toMatch(/^tg_user=; Max-Age=0/);
      expect(findSetCookie(res, SESSION)).toBeUndefined();
    });

    it("migrates names outside the Latin-1 range", async () => {
      const res = await get(`tg_user=${createSessionCookie({ first_name: "Ünal 🚀" })}`);
      expect((await res.json()).user.first_name).toBe("Ünal 🚀");
    });
  });

  describe("POST /api/telegram/session", () => {
    const post = (body: unknown, headers: Record<string, string> = {}) =>
      fetch("/api/telegram/session", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
      });

    it("logs in from a widget POST and returns the v2 shape", async () => {
      const res = await post(signAuthData());
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ loggedIn: true, user: { id: 123456789, first_name: "Test", username: "testuser" }, provider: "legacy", loggedInAt: expect.any(Number) });
      expect(res.headers.get("cache-control")).toBe("private, no-store");
      const cookie = findSetCookie(res, SESSION);
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/SameSite=Lax/);
      expect(cookie).toMatch(/Path=\//);
    });

    it("creates a session that GET can read back", async () => {
      const res = await post(signAuthData({ first_name: "Ünal 🚀" }));
      const session = await $fetch<SessionBody>("/api/telegram/session", { headers: { Cookie: toCookieHeader(res) } });
      expect(session).toMatchObject({ loggedIn: true, user: { first_name: "Ünal 🚀" } });
    });

    it("rejects a login with a bad hash", async () => {
      const res = await post({ ...signAuthData(), first_name: "Eve" });
      expect(res.status).toBe(401);
      expect(findSetCookie(res, SESSION)).toBeUndefined();
    });

    it("rejects a login older than session.maxAge", async () => {
      const res = await post(signAuthData({ auth_date: now() - 86401 }));
      expect(res.status).toBe(401);
      expect(findSetCookie(res, SESSION)).toBeUndefined();
    });

    it("rejects requests from another site", async () => {
      expect((await post(signAuthData(), { Origin: "https://evil.example" })).status).toBe(403);
      expect((await post(signAuthData(), { "Sec-Fetch-Site": "cross-site" })).status).toBe(403);
    });

    it("accepts requests from the same site", async () => {
      const sameSite: Record<string, string>[] = [{ Origin: new URL(url("/")).origin }, { "Sec-Fetch-Site": "same-origin" }];
      for (const headers of sameSite) {
        const res = await post(signAuthData(), headers);
        expect(res.status).toBe(200);
        expect(await res.json()).toMatchObject({ loggedIn: true });
      }
    });

    it("rejects bodies that are not JSON", async () => {
      const res = await post("id=1", { "Content-Type": "application/x-www-form-urlencoded" });
      expect(res.status).toBe(415);
    });
  });

  describe("GET /api/telegram/callback", () => {
    const callback = (params: Record<string, string | number>) => {
      const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
      return fetch(`/api/telegram/callback?${query}`, { redirect: "manual" });
    };

    it("logs in and redirects to the given path", async () => {
      const res = await callback({ redirect: "/dashboard", ...signAuthData() });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("/dashboard");
      expect(res.headers.get("referrer-policy")).toBe("no-referrer");
      expect(res.headers.get("cache-control")).toBe("private, no-store");
      expect(findSetCookie(res, SESSION)).toMatch(/HttpOnly/);
    });

    it("redirects to the home page when the target is on another site", async () => {
      const res = await callback({ redirect: "//evil.example", ...signAuthData() });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("/");
    });

    it("stores the numeric user id from the query string", async () => {
      const res = await callback(signAuthData());
      const session = await $fetch<SessionBody>("/api/telegram/session", { headers: { Cookie: toCookieHeader(res) } });
      expect(session.user.id).toBe(123456789);
    });

    it("rejects a login with a bad hash", async () => {
      const res = await callback({ ...signAuthData(), first_name: "Eve" });
      expect(res.status).toBe(401);
      expect(findSetCookie(res, SESSION)).toBeUndefined();
    });
  });

  describe("DELETE /api/telegram/session", () => {
    it("logs out and expires the session cookie", async () => {
      const login = await fetch("/api/telegram/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(signAuthData()) });
      const res = await fetch("/api/telegram/session", { method: "DELETE", headers: { cookie: toCookieHeader(login) } });
      expect(await res.json()).toEqual({ loggedIn: false });
      expect(findSetCookie(res, SESSION)).toMatch(/^nuxt-telegram-auth=; Max-Age=0; Path=\//);
    });

    it("also deletes a leftover tg_user cookie, so GET can't log the user back in", async () => {
      const res = await fetch("/api/telegram/session", { method: "DELETE", headers: { cookie: `tg_user=${createSessionCookie()}` } });
      expect(findSetCookie(res, "tg_user")).toMatch(/^tg_user=; Max-Age=0; Path=\//);
    });
  });

  describe("server utils", () => {
    it("guards server routes with requireTelegramSession", async () => {
      expect((await fetch("/api/me")).status).toBe(401);
      const login = await fetch("/api/telegram/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(signAuthData()) });
      const res = await fetch("/api/me", { headers: { cookie: toCookieHeader(login) } });
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ id: 123456789, first_name: "Test" });
    });
  });
});
