import * as crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { decodeAuthCookie, safeRedirect, verifyTelegramAuthData } from "../../src/runtime/server/lib/verify";

const TOKEN = "123456:test-token";

/** Signs with node:crypto so the expected hash doesn't come from the Web Crypto code under test. */
function sign(fields: Record<string, string | number>, token = TOKEN) {
  const secret = crypto.createHash("sha256").update(token).digest();
  const checkString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");
  return { ...fields, hash: crypto.createHmac("sha256", secret).update(checkString).digest("hex") };
}

const user = { id: 42, first_name: "Ada", username: "ada", auth_date: 1700000000 };

describe("verifyTelegramAuthData", () => {
  it("accepts data signed with the bot token", async () => {
    expect(await verifyTelegramAuthData(sign(user), TOKEN)).toBe(true);
  });

  it("accepts the same data as query string values", async () => {
    const fromQuery = Object.fromEntries(Object.entries(sign(user)).map(([key, value]) => [key, String(value)]));
    expect(await verifyTelegramAuthData(fromQuery, TOKEN)).toBe(true);
  });

  it("rejects data signed with another token", async () => {
    expect(await verifyTelegramAuthData(sign(user, "654321:other-token"), TOKEN)).toBe(false);
  });

  it("rejects data with a changed field", async () => {
    expect(await verifyTelegramAuthData({ ...sign(user), first_name: "Eve" }, TOKEN)).toBe(false);
  });

  it("rejects data without a hash", async () => {
    expect(await verifyTelegramAuthData(user, TOKEN)).toBe(false);
  });

  it("rejects a hash that is not hex", async () => {
    expect(await verifyTelegramAuthData({ ...user, hash: "z".repeat(64) }, TOKEN)).toBe(false);
  });

  it("rejects signed data without auth_date", async () => {
    const { auth_date: _authDate, ...withoutAuthDate } = user;
    expect(await verifyTelegramAuthData(sign(withoutAuthDate), TOKEN)).toBe(false);
  });
});

describe("auth cookie encoding", () => {
  it("reads names outside the Latin-1 range", () => {
    const data = { ...user, first_name: "Ünal 🚀" };
    expect(decodeAuthCookie(Buffer.from(JSON.stringify(data)).toString("base64"))).toEqual(data);
  });

  it("reads values written with Buffer base64", () => {
    const value = Buffer.from(JSON.stringify(user)).toString("base64");
    expect(decodeAuthCookie(value)).toEqual(user);
  });

  it("returns null for values that are not base64 JSON objects", () => {
    expect(decodeAuthCookie("not base64!")).toBeNull();
    expect(decodeAuthCookie(btoa("[1,2]"))).toBeNull();
    expect(decodeAuthCookie(btoa("plain text"))).toBeNull();
  });
});

describe("safeRedirect", () => {
  it.each([
    ["/dashboard", "/dashboard"],
    ["/a?b=1#c", "/a?b=1#c"],
    ["//evil.example", "/"],
    ["/\\evil.example", "/"],
    ["/\t/evil.example", "/"],
    ["https://evil.example", "/"],
    ["dashboard", "/"],
    [undefined, "/"],
  ])("%j redirects to %j", (input, expected) => {
    expect(safeRedirect(input)).toBe(expected);
  });

  it.each([
    ["//evil.example", "/home"],
    ["/a", "/a"],
  ])("%j with fallback /home redirects to %j", (input, expected) => {
    expect(safeRedirect(input, "/home")).toBe(expected);
  });
});
