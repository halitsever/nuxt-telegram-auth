import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { $fetch, fetch, setup } from "@nuxt/test-utils/e2e";
import { createSessionCookie, findSetCookie, toCookieHeader } from "./utils";

function complete(user: Record<string, unknown>) {
  return fetch("/api/test/complete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ user }) });
}

const hookCalls = () => $fetch<Record<string, unknown>[]>("/api/test/hook-calls");

describe("server hooks", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/v2", import.meta.url)),
  });

  it("stores data the login hook adds", async () => {
    const body = await (await complete({ id: 42, first_name: "Ada" })).json();
    expect(body.data).toEqual({ role: "admin" });
  });

  it("leaves data out when no hook adds any", async () => {
    expect(await (await complete({ id: 7 })).json()).not.toHaveProperty("data");
  });

  it("denies a login when the hook throws 403 and sets no cookie", async () => {
    const res = await complete({ id: 13 });
    expect(res.status).toBe(403);
    expect(res.headers.getSetCookie()).toEqual([]);
  });

  it("reports the denied login to the error hook", async () => {
    await hookCalls();
    await complete({ id: 13 });
    expect(await hookCalls()).toContainEqual(expect.objectContaining({ hook: "error", provider: "legacy", status: 403 }));
  });

  it("calls the session hook when GET finds a session", async () => {
    const login = await complete({ id: 42, first_name: "Ada" });
    await hookCalls();
    await fetch("/api/telegram/session", { headers: { cookie: toCookieHeader(login) } });
    expect(await hookCalls()).toContainEqual({ hook: "session", userId: 42 });
  });

  it("calls the logout hook with the session it removes", async () => {
    const login = await complete({ id: 42, first_name: "Ada" });
    await hookCalls();
    await fetch("/api/telegram/session", { method: "DELETE", headers: { cookie: toCookieHeader(login) } });
    expect(await hookCalls()).toContainEqual({ hook: "logout", userId: 42 });
  });

  it("answers loggedIn false when the login hook refuses a migrated 1.x user", async () => {
    const res = await fetch("/api/telegram/session", { headers: { cookie: `tg_user=${createSessionCookie({ id: 13 })}` } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ loggedIn: false });
    expect(findSetCookie(res, "tg_user")).toMatch(/^tg_user=; Max-Age=0/);
  });
});
