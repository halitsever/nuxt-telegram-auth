import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fetch, setup } from "@nuxt/test-utils/e2e";
import { cookieMaxAge, findSetCookie, toCookieHeader } from "./utils";

const now = () => Math.floor(Date.now() / 1000);

function login(session: Record<string, unknown>, cookie = "") {
  return fetch("/api/test/login", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(session) });
}

function readSession(cookie: string) {
  return fetch("/api/test/session", { headers: { cookie } });
}

describe("sealed session store", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/v2", import.meta.url)),
  });

  it("sets no cookie when there is no session", async () => {
    const res = await fetch("/api/test/session");
    expect(await res.json()).toEqual({ session: null });
    expect(res.headers.getSetCookie()).toEqual([]);
  });

  it("reads back a session it sealed", async () => {
    const loggedInAt = now();
    const res = await login({ user: { id: 42, first_name: "Ada" }, provider: "legacy", loggedInAt });
    expect(await (await readSession(toCookieHeader(res))).json()).toEqual({ session: { user: { id: 42, first_name: "Ada" }, provider: "legacy", loggedInAt } });
  });

  it("seals an HttpOnly, Lax cookie under the configured name", async () => {
    const cookie = findSetCookie(await login({ user: { id: 42 }, provider: "legacy", loggedInAt: now() }), "nuxt-telegram-auth")!;
    expect(cookie).toMatch(/^nuxt-telegram-auth=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookieMaxAge(cookie)).toBeGreaterThanOrEqual(86398);
    expect(cookieMaxAge(cookie)).toBeLessThanOrEqual(86400);
  });

  it("ends the cookie when the session ends", async () => {
    const cookie = findSetCookie(await login({ user: { id: 42 }, provider: "legacy", loggedInAt: now() - 3600 }), "nuxt-telegram-auth")!;
    expect(cookieMaxAge(cookie)).toBeCloseTo(82800, -1);
  });

  it("writes nothing for a session with no lifetime left", async () => {
    const res = await login({ user: { id: 42 }, provider: "legacy", loggedInAt: now() - 86400 });
    expect(res.status).toBe(500);
    expect(res.headers.getSetCookie()).toEqual([]);
  });

  it("replaces the previous session on a new write", async () => {
    const first = await login({ user: { id: 42 }, provider: "oidc", loggedInAt: now(), sub: "s1" });
    const second = await login({ user: { id: 42 }, provider: "legacy", loggedInAt: now() }, toCookieHeader(first));
    const body = await (await readSession(toCookieHeader(second))).json();
    expect(body.session.provider).toBe("legacy");
    expect(body.session).not.toHaveProperty("sub");
  });

  it("deletes a cookie it can't unseal", async () => {
    const res = await readSession("nuxt-telegram-auth=nope");
    expect(await res.json()).toEqual({ session: null });
    expect(findSetCookie(res, "nuxt-telegram-auth")).toMatch(/^nuxt-telegram-auth=; Max-Age=0; Path=\//);
  });

  it("rejects a value sealed under another cookie name", async () => {
    const sealed = await fetch("/api/test/seal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "other" }) });
    const value = findSetCookie(sealed, "other")!.split(";")[0]!.slice("other=".length);
    expect(await (await readSession(`nuxt-telegram-auth=${value}`)).json()).toEqual({ session: null });
  });
});
