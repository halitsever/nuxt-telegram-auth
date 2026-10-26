import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { $fetch, fetch, setup } from "@nuxt/test-utils/e2e";
import { mockProviderEnv, startMockProvider } from "./support/oidc-provider";
import { findSetCookie, toCookieHeader } from "./utils";

describe("Telegram Login with the popup SDK", async () => {
  const mock = await startMockProvider();
  afterAll(() => mock.close());

  // The fixture gets its client id only from the env, which Nitro parses into a number.
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/oidc", import.meta.url)),
    env: mockProviderEnv(mock),
  });

  function post(path: string, body: unknown, headers: Record<string, string> = {}) {
    return fetch(path, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  }

  async function issueNonce() {
    const res = await post("/api/telegram/nonce", {});
    return { nonce: ((await res.json()) as { nonce: string }).nonce, cookie: toCookieHeader(res) };
  }

  async function loginWith(claims: Record<string, unknown>, cookie: string) {
    return post("/api/telegram/sdk", { id_token: await mock.signIdToken(claims) }, { cookie });
  }

  const hookCalls = () => $fetch<Record<string, unknown>[]>("/api/test/hook-calls");

  it("logs in with a token that carries the issued nonce", async () => {
    const { nonce, cookie } = await issueNonce();
    const res = await loginWith({ nonce }, cookie);
    expect(await res.json()).toMatchObject({ loggedIn: true, provider: "sdk", user: { id: 987654321, first_name: "Ada" }, sub: "1111111111111111111" });
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(findSetCookie(res, "nuxt-telegram-auth")).toMatch(/HttpOnly/);
  });

  it("deletes the nonce cookie after a login", async () => {
    const { nonce, cookie } = await issueNonce();
    const res = await loginWith({ nonce }, cookie);
    expect(findSetCookie(res, "nuxt-telegram-auth-nonce")).toMatch(/^nuxt-telegram-auth-nonce=; Max-Age=0; Path=\//);
  });

  it("rejects a token when the nonce cookie is gone", async () => {
    const { nonce } = await issueNonce();
    const res = await loginWith({ nonce }, "");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ loggedIn: false, error: "expired" });
  });

  it("rejects a token whose nonce doesn't match", async () => {
    const { cookie } = await issueNonce();
    const res = await loginWith({ nonce: "other" }, cookie);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ loggedIn: false, error: "verification_failed" });
  });

  it("rejects a token for another client id and reports it", async () => {
    const { nonce, cookie } = await issueNonce();
    await hookCalls();
    const res = await loginWith({ nonce, aud: "999" }, cookie);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ loggedIn: false, error: "verification_failed" });
    expect(await hookCalls()).toContainEqual(expect.objectContaining({ hook: "error", provider: "sdk", code: "verification_failed" }));
  });

  it("rejects a token without the id claim", async () => {
    const { nonce, cookie } = await issueNonce();
    const res = await loginWith({ nonce, id: undefined }, cookie);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ loggedIn: false, error: "verification_failed" });
  });

  it("answers a login the hook denies with 403", async () => {
    const { nonce, cookie } = await issueNonce();
    const res = await loginWith({ nonce, id: "13" }, cookie);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ loggedIn: false, error: "denied" });
  });

  it.each(["/api/telegram/nonce", "/api/telegram/sdk"])("refuses cross-site and non-JSON posts to %s", async (path) => {
    expect((await post(path, {}, { origin: "https://evil.example" })).status).toBe(403);
    expect((await fetch(path, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "a=1" })).status).toBe(415);
  });
});
