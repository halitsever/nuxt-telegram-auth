import { describe, expect, it } from "vitest";
import { resolveTelegramConfig } from "../../src/runtime/server/lib/config";
import { assertOidcConfigured, buildAuthorizationUrl, resolveRedirectUri } from "../../src/runtime/server/lib/oidc";

const config = resolveTelegramConfig({ telegramAuth: { clientSecret: "secret" }, public: { telegramAuth: { clientId: "123456789" } } });
const input = { state: "state", nonce: "nonce", challenge: "challenge", redirectUri: "https://app.example/auth/telegram/callback" };

describe("resolveRedirectUri", () => {
  it("prefers the configured redirect URL", () => {
    expect(resolveRedirectUri(new URL("https://public.example/auth/telegram"), { ...config, redirectUrl: "https://configured.example/auth/telegram/callback" })).toBe(
      "https://configured.example/auth/telegram/callback",
    );
  });

  it("builds the redirect URI from the request origin", () => {
    expect(resolveRedirectUri(new URL("https://public.example/auth/telegram?x=1"), config)).toBe("https://public.example/auth/telegram/callback");
  });
});

describe("buildAuthorizationUrl", () => {
  it("asks for openid and profile and sends write as telegram:bot_access", () => {
    expect(new URL(buildAuthorizationUrl({ ...config, scope: ["profile", "phone", "write"] }, input)).searchParams.get("scope")).toBe("openid profile phone telegram:bot_access");
  });
});

describe("assertOidcConfigured", () => {
  it("explains a missing client id", () => {
    expect(() => assertOidcConfigured({ ...config, clientId: "" }, "sdk")).toThrow("Set NUXT_PUBLIC_TELEGRAM_AUTH_CLIENT_ID to use Telegram Login.");
  });

  it("explains a missing client secret for the redirect login", () => {
    expect(() => assertOidcConfigured({ ...config, clientSecret: "" }, "redirect")).toThrow("Set NUXT_TELEGRAM_AUTH_CLIENT_SECRET to use the redirect login.");
    expect(() => assertOidcConfigured({ ...config, clientSecret: "" }, "sdk")).not.toThrow();
  });
});
