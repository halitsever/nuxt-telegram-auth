import { useFetch, useState, ref } from "nuxt/app";
import type { ITelegramSession, IUserSession } from "../../types/session";

export const useSessionState = () => useState("telegram-session", () => ({}));

export function useUserSession(): IUserSession {
  const session = useSessionState();
  const loading = ref(false);
  const error = ref<string | null>(null);

  const refresh = async () => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await useFetch<ITelegramSession>("/api/telegram/session");
      session.value = data.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to fetch session";
    } finally {
      loading.value = false;
    }
  };

  refresh();

  return { session, loading, error, clearSession, refresh };
}

export const clearSession = async () => {
  await $fetch("/api/telegram/session", { method: "DELETE" });
  useSessionState().value = { loggedIn: false };
};
