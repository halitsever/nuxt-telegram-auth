import { computed, type Ref } from "vue";
import { useAsyncData, useRequestFetch, useState } from "nuxt/app";
import type { TelegramSessionResponse } from "../../shared/types";
import type { ITelegramSession, IUserSession } from "../../types/session";

const SESSION_ENDPOINT = "/api/telegram/session";

const loggedOut = (): ITelegramSession => ({ loggedIn: false, status: 401 });

/** The server answers in the 2.0 shape; this composable still hands out the 1.x one. */
export function toLegacySession(response: TelegramSessionResponse): ITelegramSession {
  return response.loggedIn ? { loggedIn: true, status: 200, ...response.user, auth_date: response.loggedInAt } : loggedOut();
}

export const useSessionState = () => useState<ITelegramSession>("telegram-session", loggedOut);

async function loadSession(session: Ref<ITelegramSession>, requestFetch: ReturnType<typeof useRequestFetch>) {
  try {
    session.value = toLegacySession(await requestFetch<TelegramSessionResponse>(SESSION_ENDPOINT));
  } catch (err) {
    session.value = loggedOut();
    throw err;
  }
  return session.value;
}

export function fetchSession(): Promise<ITelegramSession> {
  const session = useSessionState();
  return loadSession(session, useRequestFetch()).catch(() => session.value);
}

export function useUserSession(): IUserSession {
  const session = useSessionState();
  const requestFetch = useRequestFetch();
  const { status, error, refresh } = useAsyncData("telegram-session-fetch", () => loadSession(session, requestFetch));

  return {
    session,
    loading: computed(() => status.value === "pending"),
    error: computed(() => (error.value ? error.value.message || "Failed to fetch session" : null)),
    clearSession,
    refresh,
  };
}

export async function clearSession() {
  const session = useSessionState();
  await $fetch(SESSION_ENDPOINT, { method: "DELETE" });
  session.value = loggedOut();
}
