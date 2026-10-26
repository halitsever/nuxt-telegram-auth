import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fetch, setup } from "@nuxt/test-utils/e2e";
import { createSessionCookie } from "./utils";

describe("with compat.migrateLegacyCookie off", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/no-migration", import.meta.url)),
  });

  it("ignores a valid 1.x cookie and leaves it in place", async () => {
    const res = await fetch("/api/telegram/session", { headers: { cookie: `tg_user=${createSessionCookie()}` } });
    expect(await res.json()).toEqual({ loggedIn: false });
    expect(res.headers.getSetCookie()).toEqual([]);
  });
});
