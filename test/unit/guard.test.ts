import { describe, expect, it } from "vitest";
import { decideAuthRedirect } from "../../src/runtime/app/utils/guard";

const config = { loginPath: "/login", redirectAfterLogin: "/", protectAll: false };
const all = { ...config, protectAll: true };

describe("decideAuthRedirect", () => {
  it.each([
    ["protected, anonymous", { path: "/private", fullPath: "/private?a=1", meta: { telegramAuth: true } }, false, config, "/login?redirect=%2Fprivate%3Fa%3D1"],
    ["protected, logged in", { path: "/private", fullPath: "/private", meta: { telegramAuth: true } }, true, config, null],
    ["guest page, logged in", { path: "/guest-only", fullPath: "/guest-only", meta: { telegramAuth: "guest" as const } }, true, config, "/"],
    ["guest page, anonymous", { path: "/guest-only", fullPath: "/guest-only", meta: { telegramAuth: "guest" as const } }, false, config, null],
    ["no meta", { path: "/", fullPath: "/", meta: {} }, false, config, null],
    ["protectAll, no meta", { path: "/", fullPath: "/", meta: {} }, false, all, "/login?redirect=%2F"],
    ["protectAll, login page", { path: "/login", fullPath: "/login", meta: {} }, false, all, null],
    ["protectAll, opted out", { path: "/about", fullPath: "/about", meta: { telegramAuth: false } }, false, all, null],
  ])("%s", (_, to, loggedIn, cfg, expected) => {
    expect(decideAuthRedirect(to, loggedIn, cfg)).toBe(expected);
  });
});
