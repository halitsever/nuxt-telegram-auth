import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fetch, setup } from "@nuxt/test-utils/e2e";
import { createSessionCookie, toCookieHeader } from "./utils";

describe("page protection", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/pages", import.meta.url)),
  });

  async function sessionCookie() {
    const res = await fetch("/api/test/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user: { id: 42, first_name: "Ada" }, provider: "legacy", loggedInAt: Math.floor(Date.now() / 1000) }),
    });
    return toCookieHeader(res);
  }

  it("sends an anonymous visitor from a protected page to the login page", async () => {
    const res = await fetch("/private", { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/login?redirect=%2Fprivate");
  });

  it("serves a protected page with a session", async () => {
    const res = await fetch("/private", { redirect: "manual", headers: { cookie: await sessionCookie() } });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("private page");
  });

  it("sends a logged-in visitor away from a guest page", async () => {
    const res = await fetch("/guest-only", { redirect: "manual", headers: { cookie: await sessionCookie() } });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/");
  });

  it("serves pages without meta to everyone", async () => {
    const res = await fetch("/", { redirect: "manual" });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("home page");
  });

  // Nitro renders cached pages without the visitor's cookies; the HTML is shared, so it must leave the session to the browser.
  it("leaves the session to the browser on a page that Nitro caches", async () => {
    expect(await (await fetch("/cached", { headers: { cookie: await sessionCookie() } })).text()).toContain("cached page: loading");
  });

  it("serves a cached protected page and lets the browser decide", async () => {
    const res = await fetch("/cached-private", { redirect: "manual" });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("cached private page");
  });

  it("keeps session cookies out of a page that Nitro caches", async () => {
    const first = await fetch("/cached", { headers: { cookie: `tg_user=${createSessionCookie()}` } });
    expect(first.status).toBe(200);
    expect(first.headers.getSetCookie()).toEqual([]);
    const second = await fetch("/cached");
    expect(second.headers.getSetCookie()).toEqual([]);
  });

  it("prerenders a protected page instead of baking in a redirect to the login page", async () => {
    const res = await fetch("/prerendered", { redirect: "manual" });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("prerendered page");
  });
});
