import { describe, expect, it } from "vitest";
import { codeChallengeS256, randomToken, timingSafeEqualString } from "../../src/runtime/server/lib/pkce";

describe("pkce helpers", () => {
  it("matches RFC 7636 appendix B", async () => {
    expect(await codeChallengeS256("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("returns 43 base64url characters for 32 bytes", () => {
    expect(randomToken()).toMatch(/^[\w-]{43}$/);
  });

  it("returns a different token every time", () => {
    expect(randomToken()).not.toBe(randomToken());
  });

  it("compares strings in constant time", () => {
    expect(timingSafeEqualString("abc", "abc")).toBe(true);
    expect(timingSafeEqualString("abc", "abd")).toBe(false);
    expect(timingSafeEqualString("abc", "abcd")).toBe(false);
  });
});
