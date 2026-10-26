import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fetch, setup } from "@nuxt/test-utils/e2e";

describe("session without a secret", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/no-secret", import.meta.url)),
  });

  it("explains how to set a secret", async () => {
    const res = await fetch("/api/test/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user: { id: 42 }, provider: "legacy", loggedInAt: Math.floor(Date.now() / 1000) }),
    });
    expect(res.status).toBe(500);
    expect(await res.text()).toContain("Set NUXT_APP_SECRET (at least 32 characters");
  });
});
