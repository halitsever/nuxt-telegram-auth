import { afterEach, describe, expect, it } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { readBody } from "h3";
import TelegramLoginWidget from "../../src/runtime/components/TelegramLoginWidget.vue";
import { useSessionState } from "../../src/runtime/app/composables/session";

const user = { id: 42, first_name: "Ada", username: "ada", auth_date: 1700000000, hash: "a".repeat(64) };

async function mountWidget(props: Record<string, unknown> = {}) {
  const wrapper = await mountSuspended(TelegramLoginWidget, { props: { telegramLogin: "test_bot", ...props } });
  const script = wrapper.element.querySelector("script") as HTMLScriptElement;
  return { wrapper, script };
}

function callbackName(script: HTMLScriptElement) {
  return script.getAttribute("data-onauth")?.match(/^window\.(\w+)\(user\)$/)?.[1] ?? "";
}

const callbacks = () => window as unknown as Record<string, ((payload: typeof user) => Promise<void>) | undefined>;

afterEach(() => {
  useSessionState().value = { loggedIn: false, status: 401 };
});

describe("TelegramLoginWidget", () => {
  it("renders the Telegram script with the bot name and Telegram's own defaults", async () => {
    const { script } = await mountWidget();
    expect(script.src).toBe("https://telegram.org/js/telegram-widget.js?22");
    expect(script.getAttribute("data-telegram-login")).toBe("test_bot");
    expect(script.getAttribute("data-size")).toBe("medium");
    expect(script.getAttribute("data-userpic")).toBe("true");
    expect(script.hasAttribute("data-request-access")).toBe(false);
    expect(script.hasAttribute("data-radius")).toBe(false);
  });

  it("requests write access only when asked for it", async () => {
    expect((await mountWidget({ requestAccess: "write" })).script.getAttribute("data-request-access")).toBe("write");
    expect((await mountWidget({ requestAccess: "read" })).script.hasAttribute("data-request-access")).toBe(false);
  });

  it("passes the language to Telegram", async () => {
    const { script } = await mountWidget({ lang: "tr" });
    expect(script.getAttribute("data-lang")).toBe("tr");
  });

  it("gives each widget its own callback", async () => {
    const first = callbackName((await mountWidget()).script);
    const second = callbackName((await mountWidget()).script);
    expect(first).not.toBe("");
    expect(first).not.toBe(second);
    expect(callbacks()[first]).toBeTypeOf("function");
    expect(callbacks()[second]).toBeTypeOf("function");
  });

  it("removes its callback when unmounted", async () => {
    const { wrapper, script } = await mountWidget();
    const name = callbackName(script);
    wrapper.unmount();
    expect(callbacks()[name]).toBeUndefined();
  });

  it("emits loaded once the script has loaded", async () => {
    const { wrapper, script } = await mountWidget();
    expect(wrapper.emitted("loaded")).toBeUndefined();
    script.dispatchEvent(new Event("load"));
    expect(wrapper.emitted("loaded")).toHaveLength(1);
  });

  it("falls back to callback mode for an unknown mode", async () => {
    const { script } = await mountWidget({ mode: "redirct" });
    expect(callbackName(script)).not.toBe("");
    expect(script.hasAttribute("data-auth-url")).toBe(false);
  });

  it("sends redirect mode logins to the module callback route", async () => {
    const { script } = await mountWidget({ mode: "redirect", redirectTo: "/dashboard" });
    expect(script.getAttribute("data-auth-url")).toBe("/api/telegram/callback?redirect=%2Fdashboard");
    expect(script.hasAttribute("data-onauth")).toBe(false);
  });

  it("keeps a custom redirect-url in redirect mode", async () => {
    const { script } = await mountWidget({ mode: "redirect", redirectUrl: "https://example.com/auth" });
    expect(script.getAttribute("data-auth-url")).toBe("https://example.com/auth");
  });

  it("posts the login to the server, stores the session and emits callback", async () => {
    let posted: unknown;
    registerEndpoint("/api/telegram/session", {
      method: "POST",
      handler: async (event) => {
        posted = await readBody(event);
        return { loggedIn: true, status: 200, first_name: "Ada" };
      },
    });

    const { wrapper, script } = await mountWidget();
    await callbacks()[callbackName(script)]?.(user);

    expect(posted).toEqual(user);
    expect(useSessionState().value).toMatchObject({ loggedIn: true, first_name: "Ada" });
    expect(wrapper.emitted("callback")?.[0]).toEqual([user]);
  });
});
