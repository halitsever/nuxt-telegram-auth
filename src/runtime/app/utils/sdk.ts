import { shallowRef } from "vue";
import type { TelegramSession, TelegramSessionResponse } from "../../shared/types";
import { setTelegramSessionState, toTelegramSession } from "../composables/session";

export const TELEGRAM_SDK_URL = "https://oauth.telegram.org/js/telegram-login.js?6";

export interface TelegramSdkOptions {
  client_id: string;
  scope: string[];
  lang?: string;
  nonce: string;
}

export interface TelegramSdkResult {
  id_token?: string;
  error?: string;
}

export interface TelegramSdk {
  init(options: TelegramSdkOptions, callback: (result: TelegramSdkResult) => void): void;
  open(): void;
}

/** A useTelegramLogin instance, as the page-level manager sees it. */
export interface LoginConsumer {
  onResult(result: TelegramSdkResult): Promise<void>;
}

const telegramWindow = () => window as unknown as { Telegram?: { Login?: TelegramSdk } };

let loading: Promise<TelegramSdk> | undefined;
let script: HTMLScriptElement | undefined;

export function loadTelegramSdk(timeoutMs = 10_000): Promise<TelegramSdk> {
  const existing = telegramWindow().Telegram?.Login;
  if (existing) return Promise.resolve(existing);

  loading ||= new Promise<TelegramSdk>((resolve, reject) => {
    const element = document.createElement("script");
    const fail = () => {
      clearTimeout(timer);
      loading = undefined;
      element.remove();
      reject(new Error("sdk_load_failed"));
    };
    const timer = setTimeout(fail, timeoutMs);
    element.addEventListener("load", () => {
      clearTimeout(timer);
      const sdk = telegramWindow().Telegram?.Login;
      if (sdk) resolve(sdk);
      else fail();
    });
    element.addEventListener("error", fail);
    element.src = TELEGRAM_SDK_URL;
    element.async = true;
    script = element;
    document.head.appendChild(element);
  });
  return loading;
}

/**
 * Runs `open` and reports whether the browser blocked the popup it tried to open. The SDK keeps that
 * window to itself, so window.open is watched instead. Telegram's in-app browser opens no window at all;
 * that isn't a block.
 */
export function isPopupBlocked(open: () => void): boolean {
  const descriptor = Object.getOwnPropertyDescriptor(window, "open");
  const original = window.open;
  let opened: Window | null | undefined;
  // defineProperty instead of assignment: window.open isn't a writable data property everywhere.
  Object.defineProperty(window, "open", {
    configurable: true,
    writable: true,
    value: function (this: Window, ...args: Parameters<typeof window.open>) {
      opened = original.apply(this, args);
      return opened;
    },
  });
  try {
    open();
  } finally {
    if (descriptor) Object.defineProperty(window, "open", descriptor);
    else Reflect.deleteProperty(window, "open");
  }
  return opened === null;
}

export async function loginWithIdToken(idToken: string): Promise<TelegramSession> {
  const session = toTelegramSession(await $fetch<TelegramSessionResponse>("/api/telegram/sdk", { method: "POST", body: { id_token: idToken } }));
  if (!session) throw new Error("The server didn't create a session.");
  setTelegramSessionState(session);
  return session;
}

// The SDK keeps one global init per page, so every useTelegramLogin on the page shares this state.
const consumers = new Set<LoginConsumer>();
let active: LoginConsumer | null = null;
let current: { sdk: TelegramSdk; options: TelegramSdkOptions } | null = null;
let preparing: Promise<void> | null = null;
let clientId = "";
let generation = 0;

/** True while the SDK is loaded and holds a nonce no login has used yet. */
export const telegramSdkReady = shallowRef(false);

async function fetchNonce(): Promise<string> {
  const { nonce } = await $fetch<{ nonce: string }>("/api/telegram/nonce", { method: "POST", body: {} });
  return nonce;
}

function prepare(): Promise<void> {
  if (!preparing) {
    const started = generation;
    preparing = (async () => {
      const sdk = await loadTelegramSdk();
      const nonce = await fetchNonce();
      if (started !== generation) return;
      current = { sdk, options: { client_id: clientId, scope: ["profile"], nonce } };
      sdk.init(current.options, dispatch);
      telegramSdkReady.value = true;
    })();
    const promise = preparing;
    // A reset may have started a newer attempt meanwhile; don't forget that one.
    promise.finally(() => {
      if (preparing === promise) preparing = null;
    }).catch(() => {});
  }
  return preparing;
}

async function dispatch(result: TelegramSdkResult): Promise<void> {
  // The nonce is spent from here on; nobody may open the popup with it again.
  telegramSdkReady.value = false;
  current = null;
  const target = active ?? [...consumers].at(-1) ?? null;
  active = null;
  try {
    if (target) await target.onResult(result);
    else if (result.id_token) await loginWithIdToken(result.id_token).catch(() => {});
  } finally {
    // Only after the token was posted: a new nonce cookie would otherwise replace the one it needs.
    await prepare().catch(() => {});
  }
}

export function prepareTelegramSdk(id: string): Promise<void> {
  clientId = id;
  return current && telegramSdkReady.value ? Promise.resolve() : prepare();
}

export function connectTelegramSdk(consumer: LoginConsumer): () => void {
  consumers.add(consumer);
  return () => {
    consumers.delete(consumer);
    if (active === consumer) active = null;
  };
}

/** Opens the popup for `consumer` with its own scope and language. Has to run synchronously inside the click. */
export function openTelegramSdk(consumer: LoginConsumer, scope: string[], lang?: string): "opened" | "blocked" | "unavailable" {
  if (!current || !telegramSdkReady.value) return "unavailable";
  const { sdk, options } = current;
  active = consumer;
  sdk.init({ ...options, scope, lang }, dispatch);
  if (isPopupBlocked(() => sdk.open())) {
    active = null;
    return "blocked";
  }
  return "opened";
}

/** Runs `init` again so the SDK also decorates buttons that mounted after the first one. */
export function refreshTelegramSdkButtons(): void {
  if (current) current.sdk.init(current.options, dispatch);
}

/** Forgets the SDK, its nonce and its listeners. */
export function resetTelegramSdk(): void {
  generation++;
  consumers.clear();
  active = null;
  current = null;
  preparing = null;
  loading = undefined;
  script?.remove();
  script = undefined;
  telegramSdkReady.value = false;
}
