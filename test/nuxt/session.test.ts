import { describe, expect, it } from "vitest";
import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { setTelegramSessionState, useTelegramSession } from "../../src/runtime/app/composables/session";
import { useUserSession } from "../../src/runtime/app/composables/compat";

const ada = { user: { id: 42, first_name: "Ada" }, provider: "legacy" as const, loggedInAt: 1700000000 };

describe("useTelegramSession", () => {
  it("dedupes concurrent fetch calls into one request", async () => {
    let calls = 0;
    registerEndpoint("/api/telegram/session", {
      method: "GET",
      handler: () => {
        calls++;
        return { loggedIn: true, ...ada };
      },
    });

    const { fetch, user, ready } = useTelegramSession();
    await Promise.all([fetch(), fetch()]);
    expect(calls).toBe(1);
    expect(user.value?.id).toBe(42);
    expect(ready.value).toBe(true);
  });

  it("clear() calls DELETE and resets the state", async () => {
    let deleted = false;
    registerEndpoint("/api/telegram/session", {
      method: "DELETE",
      handler: () => {
        deleted = true;
        return { loggedIn: false };
      },
    });
    setTelegramSessionState(ada);

    const { clear, loggedIn } = useTelegramSession();
    await clear();
    expect(deleted).toBe(true);
    expect(loggedIn.value).toBe(false);
  });
});

describe("useUserSession (deprecated)", () => {
  it("maps the v2 session to the 1.x shape", () => {
    setTelegramSessionState(ada);
    expect(useUserSession().session.value).toMatchObject({ loggedIn: true, status: 200, id: 42, first_name: "Ada" });
    setTelegramSessionState(null);
    expect(useUserSession().session.value).toEqual({ loggedIn: false, status: 401 });
  });
});
