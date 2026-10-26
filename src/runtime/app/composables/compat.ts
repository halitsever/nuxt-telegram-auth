import { computed, readonly, ref, type ComputedRef, type Ref } from "vue";
import { useTelegramSession } from "./session";

/** The session shape 1.x handed out. */
export interface LegacyTelegramSession {
  loggedIn: boolean;
  status: number;
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number;
}

export interface LegacyUserSession {
  session: ComputedRef<LegacyTelegramSession>;
  loading: ComputedRef<boolean>;
  error: Readonly<Ref<string | null>>;
  clearSession: () => Promise<void>;
  refresh: () => Promise<void>;
}

let warned = false;

/** @deprecated Use `useTelegramSession()`. */
export function useUserSession(): LegacyUserSession {
  if (import.meta.dev && !warned) {
    warned = true;
    console.warn("[nuxt-telegram-auth] `useUserSession` is deprecated. Use `useTelegramSession`.");
  }

  const { session, ready, fetch, clear } = useTelegramSession();
  const refreshing = ref(false);
  const error = ref<string | null>(null);

  async function refresh() {
    refreshing.value = true;
    try {
      await fetch();
      error.value = null;
    } catch (cause) {
      error.value = (cause as Error).message || "Failed to fetch session";
    } finally {
      refreshing.value = false;
    }
  }

  return {
    session: computed(() => (session.value ? { loggedIn: true, status: 200, ...session.value.user, auth_date: session.value.loggedInAt } : { loggedIn: false, status: 401 })),
    loading: computed(() => !ready.value || refreshing.value),
    error: readonly(error),
    clearSession: clear,
    refresh,
  };
}
