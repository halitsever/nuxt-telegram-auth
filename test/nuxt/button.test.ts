import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import TelegramLoginButton from "../../src/runtime/components/TelegramLoginButton.vue";
import { setTelegramSessionState } from "../../src/runtime/app/composables/session";
import { resetTelegramSdk } from "../../src/runtime/app/utils/sdk";
import { installFakeSdk, telegramConfig, type FakeSdk, type TelegramWindow } from "./fake-sdk";

const ada = { id: 987654321, first_name: "Ada" };
const unmounts: (() => void)[] = [];
let releaseNonce: () => void = () => {};
let fake: FakeSdk;

async function mountButton(options: { props?: Record<string, unknown>; slots?: Record<string, string> } = {}) {
  const wrapper = await mountSuspended(TelegramLoginButton, { ...options, attachTo: document.body });
  unmounts.push(() => wrapper.unmount());
  return wrapper;
}

type Wrapper = Awaited<ReturnType<typeof mountButton>>;

async function whenReady(wrapper: Wrapper) {
  releaseNonce();
  await vi.waitFor(() => expect(wrapper.find("button").attributes("disabled")).toBeUndefined());
}

beforeEach(() => {
  resetTelegramSdk();
  fake = installFakeSdk();
  telegramConfig().clientId = "123456789";
  let count = 0;
  registerEndpoint("/api/telegram/nonce", {
    method: "POST",
    // Holds the nonce back until the test calls releaseNonce(), so "not ready yet" is observable.
    handler: () =>
      new Promise((resolve) => {
        releaseNonce = () => resolve({ nonce: `nonce-${++count}` });
      }),
  });
  registerEndpoint("/api/telegram/sdk", { method: "POST", handler: () => ({ loggedIn: true, user: ada, provider: "sdk", loggedInAt: 1700000000 }) });
});

afterEach(() => {
  releaseNonce();
  for (const unmount of unmounts.splice(0)) unmount();
  setTelegramSessionState(null);
  telegramConfig().clientId = "";
  delete (window as TelegramWindow).Telegram;
  vi.restoreAllMocks();
});

describe("TelegramLoginButton", () => {
  it("renders a tg-auth-button with the variant in data-style and the default label", async () => {
    const button = (await mountButton({ props: { variant: ["outlined", "shine"] } })).find("button");
    expect(button.classes()).toContain("tg-auth-button");
    expect(button.attributes("data-style")).toBe("outlined shine");
    expect(button.text()).toBe("Log in with Telegram");
  });

  it("stays disabled until the SDK is ready in popup mode", async () => {
    const wrapper = await mountButton();
    expect(wrapper.find("button").attributes("disabled")).toBeDefined();
    await whenReady(wrapper);
  });

  it("stays clickable while a login is pending", async () => {
    const wrapper = await mountButton();
    await whenReady(wrapper);
    await wrapper.find("button").trigger("click");
    expect(fake.opens).toBe(1);
    expect(wrapper.find("button").attributes("disabled")).toBeUndefined();
  });

  it("calls login() and keeps the click from the SDK's document listener", async () => {
    const documentClick = vi.fn();
    document.addEventListener("click", documentClick);
    const wrapper = await mountButton();
    await whenReady(wrapper);
    await wrapper.find("button").trigger("click");
    document.removeEventListener("click", documentClick);
    expect(fake.opens).toBe(1);
    expect(documentClick).not.toHaveBeenCalled();
  });

  it("emits success only from the button that was clicked", async () => {
    const first = await mountButton();
    const second = await mountButton();
    await whenReady(second);
    await second.find("button").trigger("click");
    fake.callback!({ id_token: "token-1" });
    await vi.waitFor(() => expect(second.emitted("success")).toEqual([[ada]]));
    expect(first.emitted("success")).toBeUndefined();
  });

  it("emits error with the code when the login fails", async () => {
    const wrapper = await mountButton();
    await whenReady(wrapper);
    await wrapper.find("button").trigger("click");
    fake.callback!({ error: "popup_closed" });
    await vi.waitFor(() => expect(wrapper.emitted("error")).toEqual([["popup_closed"]]));
  });

  it("reports a failed SDK load and lets a click try again", async () => {
    delete (window as TelegramWindow).Telegram;
    const wrapper = await mountButton();
    await vi.waitFor(() => expect(wrapper.emitted("error")).toEqual([["sdk_load_failed"]]));
    expect(wrapper.find("button").attributes("disabled")).toBeUndefined();
  });

  it("renders custom slot content", async () => {
    const wrapper = await mountButton({ slots: { default: "Continue with Telegram" } });
    expect(wrapper.find("button").text()).toBe("Continue with Telegram");
  });
});
