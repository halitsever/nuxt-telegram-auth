import { describe, expect, it } from "vitest";
import { collectConfigWarnings } from "../../src/warnings";

const complete = {
  options: {},
  runtimeConfig: { TELEGRAM_TOKEN: "", telegramAuth: { botToken: "123456789:secret" }, public: { telegramAuth: { clientId: "123456789" } } },
  env: {},
};

describe("collectConfigWarnings", () => {
  it("warns about sessionMaxAge", () => {
    expect(collectConfigWarnings({ ...complete, options: { sessionMaxAge: 3600 } })).toContain("`sessionMaxAge` is deprecated. Use `session.maxAge`.");
  });

  it("warns about TELEGRAM_TOKEN", () => {
    expect(collectConfigWarnings({ ...complete, env: { NUXT_TELEGRAM_TOKEN: "123456789:secret" } })).toContain("`TELEGRAM_TOKEN` is deprecated. Use NUXT_TELEGRAM_AUTH_BOT_TOKEN.");
  });

  it("warns when the client id and the bot token belong to different bots", () => {
    const warnings = collectConfigWarnings({ ...complete, runtimeConfig: { telegramAuth: { botToken: "2:secret" }, public: { telegramAuth: { clientId: "1" } } } });
    expect(warnings).toContain("The client id (1) doesn't match the bot id in the bot token (2). Both must come from the same bot.");
    expect(warnings.join("\n")).not.toContain("secret");
  });

  it("never prints a bot token that has no bot id part", () => {
    const warnings = collectConfigWarnings({ ...complete, runtimeConfig: { telegramAuth: { botToken: "nocolonsecret" }, public: { telegramAuth: { clientId: "1" } } } });
    expect(warnings.join("\n")).not.toContain("nocolonsecret");
  });

  it("warns when neither a client id nor a bot token is set", () => {
    expect(collectConfigWarnings({ options: {}, runtimeConfig: { telegramAuth: {}, public: { telegramAuth: {} } }, env: {} })).toEqual([
      "Set NUXT_PUBLIC_TELEGRAM_AUTH_CLIENT_ID for Telegram Login, or NUXT_TELEGRAM_AUTH_BOT_TOKEN for the legacy widget.",
    ]);
  });

  it("stays quiet for a complete setup", () => {
    expect(collectConfigWarnings(complete)).toEqual([]);
  });
});
