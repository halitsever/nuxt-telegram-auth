import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { $fetch, fetch, setup, url } from "@nuxt/test-utils/e2e";
import { mockProviderEnv, startMockProvider } from "./support/oidc-provider";
import { toCookieHeader } from "./utils";

describe("Telegram Login with the OIDC redirect", async () => {
  const mock = await startMockProvider();
  afterAll(() => mock.close());

  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/oidc", import.meta.url)),
    env: mockProviderEnv(mock),
  });

  async function start(path = "/auth/telegram?redirect=/dashboard", headers: Record<string, string> = {}) {
    const res = await fetch(path, { redirect: "manual", headers });
    return { res, location: new URL(res.headers.get("location")!), cookie: toCookieHeader(res) };
  }

  function callback(params: Record<string, string>, cookie: string) {
    return fetch(`/auth/telegram/callback?${new URLSearchParams(params)}`, { redirect: "manual", headers: { cookie } });
  }

  async function login(redirect = "/dashboard") {
    const begun = await start(`/auth/telegram?redirect=${encodeURIComponent(redirect)}`);
    mock.nextNonce = begun.location.searchParams.get("nonce");
    const res = await callback({ code: "code-1", state: begun.location.searchParams.get("state")! }, begun.cookie);
    return { begun, res };
  }

  const hookCalls = () => $fetch<Record<string, unknown>[]>("/api/test/hook-calls");

  it("redirects to the provider with PKCE, state, nonce and the openid profile scope", async () => {
    const { res, location } = await start();
    expect(res.status).toBe(302);
    expect(`${location.origin}${location.pathname}`).toBe(`${mock.url}/auth`);
    expect(location.searchParams.get("response_type")).toBe("code");
    expect(location.searchParams.get("client_id")).toBe("123456789");
    expect(location.searchParams.get("code_challenge_method")).toBe("S256");
    expect(location.searchParams.get("code_challenge")).toMatch(/^[\w-]{43}$/);
    expect(location.searchParams.get("state")).toMatch(/^[\w-]{43}$/);
    expect(location.searchParams.get("nonce")).toMatch(/^[\w-]{43}$/);
    expect(location.searchParams.get("scope")).toBe("openid profile");
    expect(location.searchParams.get("redirect_uri")).toBe(`${new URL(url("/")).origin}/auth/telegram/callback`);
  });

  it("builds the redirect URI from X-Forwarded-Host and X-Forwarded-Proto", async () => {
    const { location } = await start("/auth/telegram", { "x-forwarded-host": "public.example", "x-forwarded-proto": "https" });
    expect(location.searchParams.get("redirect_uri")).toBe("https://public.example/auth/telegram/callback");
  });

  it("logs in on the callback and redirects to the target", async () => {
    mock.tokenRequests.length = 0;
    const { begun, res } = await login();
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/dashboard");
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
    expect(res.headers.get("cache-control")).toBe("private, no-store");

    const session = await $fetch("/api/telegram/session", { headers: { cookie: toCookieHeader(res) } });
    expect(session).toMatchObject({ loggedIn: true, provider: "oidc", user: { id: 987654321, first_name: "Ada" }, sub: "1111111111111111111" });

    expect(mock.tokenRequests[0]!.authorization).toBe(`Basic ${btoa("123456789:test-secret")}`);
    const verifier = mock.tokenRequests[0]!.body.get("code_verifier")!;
    expect(createHash("sha256").update(verifier).digest("base64url")).toBe(begun.location.searchParams.get("code_challenge"));
  });

  it("sends a state mismatch to the login page and reports it", async () => {
    const begun = await start();
    await hookCalls();
    const res = await callback({ code: "code-1", state: "wrong" }, begun.cookie);
    expect(res.headers.get("location")).toBe("/login?telegram_error=invalid_state");
    expect(await hookCalls()).toContainEqual(expect.objectContaining({ hook: "error", provider: "oidc", code: "invalid_state" }));
  });

  it("sends a provider error to the login page", async () => {
    const begun = await start();
    const res = await callback({ error: "access_denied", state: begun.location.searchParams.get("state")! }, begun.cookie);
    expect(res.headers.get("location")).toBe("/login?telegram_error=provider_error");
  });

  it("sends a failed token exchange to the login page", async () => {
    mock.tokenError = "invalid_grant";
    const { res } = await login();
    expect(res.headers.get("location")).toBe("/login?telegram_error=provider_error");
  });

  it("sends a login the hook denies to the login page", async () => {
    mock.nextClaims = { id: "13" };
    const { res } = await login();
    expect(res.headers.get("location")).toBe("/login?telegram_error=denied");
  });

  it("sends a repeated callback with a session to redirectAfterLogin", async () => {
    const { begun, res } = await login();
    // The page reloads: the transaction cookie is gone, the session cookie is there.
    const again = await callback({ code: "code-1", state: begun.location.searchParams.get("state")! }, toCookieHeader(res));
    expect(again.headers.get("location")).toBe("/");
  });

  it("sends a repeated callback without a session to the login page", async () => {
    const res = await callback({ code: "code-1", state: "anything" }, "");
    expect(res.headers.get("location")).toBe("/login?telegram_error=expired");
  });
});
