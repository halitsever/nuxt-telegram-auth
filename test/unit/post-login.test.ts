import { describe, expect, it } from "vitest";
import { resolvePostLoginTarget } from "../../src/runtime/app/utils/post-login";

const config = { loginPath: "/login", redirectAfterLogin: "/home" };

describe("resolvePostLoginTarget", () => {
  it.each([
    [{ path: "/login", fullPath: "/login?redirect=/a", query: { redirect: "/a" } }, { mode: "popup" as const }, "/a"],
    [{ path: "/login", fullPath: "/login", query: {} }, { mode: "popup" as const }, "/home"],
    [{ path: "/login", fullPath: "/login?redirect=//evil.example", query: { redirect: "//evil.example" } }, { mode: "popup" as const }, "/home"],
    [{ path: "/blog", fullPath: "/blog?p=2", query: { p: "2" } }, { mode: "popup" as const }, null],
    [{ path: "/blog", fullPath: "/blog?p=2", query: { p: "2" } }, { mode: "redirect" as const }, "/blog?p=2"],
    [{ path: "/blog", fullPath: "/blog", query: {} }, { mode: "popup" as const, redirectTo: "/x" }, "/x"],
  ])("%j + %j → %j", (route, options, expected) => {
    expect(resolvePostLoginTarget(route, options, config)).toBe(expected);
  });
});
