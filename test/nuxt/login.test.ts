import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { readBody } from "h3";
import { useRoute } from "#app";
import { setTelegramSessionState, useTelegramSession } from "../../src/runtime/app/composables/session";
import { useTelegramLogin, type UseTelegramLoginOptions } from "../../src/runtime/app/composables/login";
import { resetTelegramSdk, TELEGRAM_SDK_URL } from "../../src/runtime/app/utils/sdk";
import { installFakeSdk, telegramConfig, type TelegramWindow } from "./fake-sdk";

const ada = { id: 987654321, first_name: "Ada" };

let issued: string[] = [];
let posted: unknown[] = [];
const unmounts: (() => void)[] = [];

async function mountLogin(options: UseTelegramLoginOptions = {}) {
  let api!: ReturnType<typeof useTelegramLogin>;
  const wrapper = await mountSuspended(
    defineComponent({
      setup() {
        api = useTelegramLogin(options);
        return () => h("div");
      },
    }),
  );
  unmounts.push(() => wrapper.unmount());
  return api;
}

beforeEach(() => {
  resetTelegramSdk();
  issued = [];
  posted = [];
  telegramConfig().clientId = "123456789";
  registerEndpoint("/api/telegram/nonce", {
    method: "POST",
    handler: () => {
      issued.push(`nonce-${issued.length + 1}`);
      return { nonce: issued.at(-1) };
    },
  });
  registerEndpoint("/api/telegram/sdk", {
    method: "POST",
    handler: async (event) => {
      posted.push(await readBody(event));
      return { loggedIn: true, user: ada, provider: "sdk", loggedInAt: 1700000000 };
    },
  });
});

afterEach(() => {
  for (const unmount of unmounts.splice(0)) unmount();
  setTelegramSessionState(null);
  telegramConfig().clientId = "";
  delete (window as TelegramWindow).Telegram;
  vi.restoreAllMocks();
});

describe("useTelegramLogin", () => {
  it("loads the SDK script once per page", async () => {
    // Kept out of the DOM: with script loading off, happy-dom would fail the script at once.
    const appended: HTMLScriptElement[] = [];
    vi.spyOn(document.head, "appendChild").mockImplementation((node) => {
      appended.push(node as HTMLScriptElement);
      return node;
    });
    const first = await mountLogin();
    const second = await mountLogin();
    const scripts = appended.filter((node) => node.src === TELEGRAM_SDK_URL);
    expect(scripts).toHaveLength(1);

    installFakeSdk();
    scripts[0]!.dispatchEvent(new Event("load"));
    await vi.waitFor(() => expect(first.ready.value && second.ready.value).toBe(true));
  });

  it("inits the SDK with the client id, the profile scope and the issued nonce", async () => {
    const fake = installFakeSdk();
    const login = await mountLogin();
    await vi.waitFor(() => expect(login.ready.value).toBe(true));
    expect(fake.inits.at(-1)).toEqual({ client_id: "123456789", scope: ["profile"], nonce: issued.at(-1) });
  });

  it("never calls auth()", async () => {
    const fake = installFakeSdk();
    const login = await mountLogin({ scope: ["phone"] });
    await vi.waitFor(() => expect(login.ready.value).toBe(true));
    login.login();
    expect(fake.opens).toBe(1);
    expect(fake.inits.at(-1)?.scope).toEqual(["profile", "phone"]);
    expect(fake.auth).not.toHaveBeenCalled();
  });

  it("posts the id token, stores the session and goes to the post-login target", async () => {
    const fake = installFakeSdk();
    const login = await mountLogin({ redirectTo: "/?welcome=1" });
    await vi.waitFor(() => expect(login.ready.value).toBe(true));
    login.login();
    fake.callback!({ id_token: "token-1" });

    await vi.waitFor(() => expect(useTelegramSession().user.value).toEqual(ada));
    expect(posted).toEqual([{ id_token: "token-1" }]);
    await vi.waitFor(() => expect(useRoute().fullPath).toBe("/?welcome=1"));
    expect(login.pending.value).toBe(false);
    expect(login.error.value).toBeNull();
  });

  it("issues a new nonce and inits again after each attempt", async () => {
    const fake = installFakeSdk();
    const login = await mountLogin();
    await vi.waitFor(() => expect(login.ready.value).toBe(true));
    const firstNonce = fake.inits.at(-1)!.nonce;

    login.login();
    fake.callback!({ error: "popup_closed" });
    await vi.waitFor(() => expect(fake.inits.at(-1)!.nonce).not.toBe(firstNonce));
    expect(fake.inits.at(-1)!.nonce).toBe(issued.at(-1));
  });

  it("reports popup_closed and clears pending", async () => {
    const fake = installFakeSdk();
    const login = await mountLogin();
    await vi.waitFor(() => expect(login.ready.value).toBe(true));
    login.login();
    expect(login.pending.value).toBe(true);
    fake.callback!({ error: "popup_closed" });
    await vi.waitFor(() => expect(login.error.value).toBe("popup_closed"));
    expect(login.pending.value).toBe(false);
  });

  it("reports popup_blocked and clears pending when window.open returns null", async () => {
    const fake = installFakeSdk();
    fake.openImpl = () => window.open("https://oauth.telegram.org/auth", "telegram_oidc_login");
    vi.spyOn(window, "open").mockReturnValue(null);
    const login = await mountLogin();
    await vi.waitFor(() => expect(login.ready.value).toBe(true));
    login.login();
    expect(login.error.value).toBe("popup_blocked");
    expect(login.pending.value).toBe(false);
  });

  it("completes a login confirmed in Telegram's in-app browser", async () => {
    const fake = installFakeSdk();
    const login = await mountLogin();
    await vi.waitFor(() => expect(login.ready.value).toBe(true));
    login.login();
    expect(login.error.value).toBeNull();
    expect(login.pending.value).toBe(true);

    fake.callback!({ id_token: "token-2" });
    await vi.waitFor(() => expect(useTelegramSession().user.value).toEqual(ada));
    expect(login.pending.value).toBe(false);
  });

  it("starts over when login() runs again without a result", async () => {
    const fake = installFakeSdk();
    const login = await mountLogin();
    await vi.waitFor(() => expect(login.ready.value).toBe(true));
    login.login();
    login.login();
    expect(fake.opens).toBe(2);
    expect(login.error.value).toBeNull();
    expect(login.pending.value).toBe(true);
  });

  it("logs in when another .tg-auth-button on the page started it", async () => {
    const fake = installFakeSdk();
    const login = await mountLogin();
    await vi.waitFor(() => expect(login.ready.value).toBe(true));
    fake.callback!({ id_token: "token-3" });
    await vi.waitFor(() => expect(useTelegramSession().user.value).toEqual(ada));
  });

  it("reports not_configured and stays not ready without a client id", async () => {
    installFakeSdk();
    telegramConfig().clientId = "";
    const login = await mountLogin();
    expect(login.error.value).toBe("not_configured");
    login.login();
    expect(login.error.value).toBe("not_configured");
    expect(login.ready.value).toBe(false);
  });

  it("goes to /auth/telegram?redirect=… in redirect mode without loading the SDK", async () => {
    const assign = vi.spyOn(window.location, "assign").mockImplementation(() => {});
    const login = await mountLogin({ mode: "redirect" });
    expect(login.ready.value).toBe(true);
    login.login();
    expect(assign).toHaveBeenCalledWith("/auth/telegram?redirect=%2F");
    expect(document.head.querySelector(`script[src="${TELEGRAM_SDK_URL}"]`)).toBeNull();
  });
});
