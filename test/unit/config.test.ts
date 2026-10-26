import { describe, expect, it } from "vitest";
import { resolveTelegramConfig } from "../../src/runtime/server/lib/config";

const base = { telegramAuth: {}, public: { telegramAuth: {} } };

describe("resolveTelegramConfig", () => {
  it("fills Telegram's endpoints and the defaults", () => {
    const config = resolveTelegramConfig(base);
    expect(config.oidc.issuer).toBe("https://oauth.telegram.org");
    expect(config.oidc.jwksUri).toBe("https://oauth.telegram.org/.well-known/jwks.json");
    expect(config.session).toMatchObject({ name: "nuxt-telegram-auth", maxAge: 86400 });
    expect(config.scope).toEqual(["profile"]);
    expect(config.migrateLegacyCookie).toBe(true);
  });

  it("keeps a numeric client id and secret from the environment as strings", () => {
    const config = resolveTelegramConfig({ telegramAuth: { clientSecret: 4242 }, public: { telegramAuth: { clientId: 123456789 } } });
    expect(config.clientId).toBe("123456789");
    expect(config.clientSecret).toBe("4242");
  });

  it("falls back to the 1.x TELEGRAM_TOKEN", () => {
    expect(resolveTelegramConfig({ ...base, TELEGRAM_TOKEN: "1:abc" }).botToken).toBe("1:abc");
  });

  it("puts profile first and adds phone and write once", () => {
    expect(resolveTelegramConfig({ telegramAuth: {}, public: { telegramAuth: { scope: ["write", "phone", "write"] } } }).scope).toEqual(["profile", "write", "phone"]);
  });

  it("reads a space-separated scope from the environment", () => {
    expect(resolveTelegramConfig({ telegramAuth: {}, public: { telegramAuth: { scope: "phone write" } } }).scope).toEqual(["profile", "phone", "write"]);
  });

  it("keeps a JWKS that the environment parser turned into an object as JSON", () => {
    const jwks = { keys: [{ kty: "RSA", kid: "oidc-1" }] };
    expect(JSON.parse(resolveTelegramConfig({ telegramAuth: { oidc: { jwks } }, public: { telegramAuth: {} } }).oidc.jwks)).toEqual(jwks);
  });
});
