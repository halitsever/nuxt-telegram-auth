import { useFetch, useState } from "nuxt/app";
import type { ITelegramSession, IUserSession } from "../../types/session";

export const useSessionState = () => useState("telegram-session", () => ({}));

export function useUserSession(): IUserSession {
  fetchSession();
  const session = useSessionState();
  return { session, clearSession };
}

export const clearSession = async () => {
  await $fetch("/api/telegram/session", { method: "DELETE" });
  useSessionState().value = { loggedIn: false };
};

export const fetchSession = async () => {
  const sessionState = useSessionState();
  const { data } = await useFetch<ITelegramSession>("/api/telegram/session");
  sessionState.value = data.value;
};
