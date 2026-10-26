import { computed, readonly, type ComputedRef, type Ref } from "vue";
import { useNuxtApp, useRequestFetch, useResponseHeader, useState } from "nuxt/app";
import type { TelegramSession, TelegramSessionResponse, TelegramUser } from "../../shared/types";

const SESSION_ENDPOINT = "/api/telegram/session";
const inFlight = new WeakMap<object, Promise<void>>();

export interface TelegramSessionComposable {
  session: Readonly<Ref<TelegramSession | null>>;
  user: ComputedRef<TelegramUser | null>;
  loggedIn: ComputedRef<boolean>;
  /** False until the first answer from the server. */
  ready: Readonly<Ref<boolean>>;
  fetch: () => Promise<void>;
  clear: () => Promise<void>;
}

/** `undefined` until the first answer, so "not loaded yet" and "logged out" stay apart. */
const useSessionState = () => useState<TelegramSession | null | undefined>("telegram-auth:session", () => undefined);
const useReadyState = () => useState("telegram-auth:ready", () => false);

export function setTelegramSessionState(session: TelegramSession | null): void {
  useSessionState().value = session;
  useReadyState().value = true;
}

export function toTelegramSession(response: TelegramSessionResponse): TelegramSession | null {
  if (!response.loggedIn) return null;
  const { loggedIn: _loggedIn, ...session } = response;
  return session;
}

function appendSetCookie(header: Ref<string | number | string[] | undefined>, cookies: string[]) {
  const current = header.value;
  header.value = [...(Array.isArray(current) ? current : current ? [String(current)] : []), ...cookies];
}

export function useTelegramSession(): TelegramSessionComposable {
  const nuxtApp = useNuxtApp();
  const state = useSessionState();
  const ready = useReadyState();
  const requestFetch = useRequestFetch();
  // During SSR the session endpoint runs inside the page request; cookies it sets (a migrated 1.x login) must reach the browser.
  const setCookieHeader = import.meta.server ? useResponseHeader("set-cookie") : undefined;

  function fetch(): Promise<void> {
    let pending = inFlight.get(nuxtApp);
    if (!pending) {
      pending = requestFetch<TelegramSessionResponse>(SESSION_ENDPOINT, {
        onResponse: setCookieHeader
          ? ({ response }) => {
              const cookies = response.headers.getSetCookie();
              if (cookies.length > 0) appendSetCookie(setCookieHeader, cookies);
            }
          : undefined,
      })
        .then(
          (response) => {
            state.value = toTelegramSession(response);
            ready.value = true;
          },
          (error) => {
            state.value = null;
            ready.value = true;
            throw error;
          },
        )
        .finally(() => inFlight.delete(nuxtApp));
      inFlight.set(nuxtApp, pending);
    }
    return pending;
  }

  async function clear(): Promise<void> {
    await requestFetch(SESSION_ENDPOINT, { method: "DELETE" });
    state.value = null;
    ready.value = true;
  }

  return {
    session: computed(() => state.value ?? null),
    user: computed(() => state.value?.user ?? null),
    loggedIn: computed(() => !!state.value),
    ready: readonly(ready),
    fetch,
    clear,
  };
}
