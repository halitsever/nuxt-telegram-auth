import { computed, onBeforeUnmount, onMounted, readonly, ref, type ComputedRef, type Ref } from "vue";
import { navigateTo, useRoute, useRuntimeConfig } from "nuxt/app";
import { DEFAULT_LOGIN_PATH, DEFAULT_REDIRECT_AFTER_LOGIN, normalizeScope } from "../../shared/defaults";
import type { TelegramLoginErrorCode, TelegramUser } from "../../shared/types";
import { resolvePostLoginTarget } from "../utils/post-login";
import { connectTelegramSdk, loginWithIdToken, openTelegramSdk, prepareTelegramSdk, telegramSdkReady, type LoginConsumer } from "../utils/sdk";

export interface UseTelegramLoginOptions {
  /** `profile` is always requested; this adds more. */
  scope?: ("phone" | "write")[];
  lang?: string;
  mode?: "popup" | "redirect";
  /** Where to go after the login, wherever it started. */
  redirectTo?: string;
  onSuccess?: (user: TelegramUser) => void;
  onError?: (code: TelegramLoginErrorCode) => void;
}

export interface UseTelegramLogin {
  ready: ComputedRef<boolean>;
  pending: Readonly<Ref<boolean>>;
  error: Readonly<Ref<TelegramLoginErrorCode | null>>;
  login: () => void;
}

const SERVER_ERROR_CODES = new Set<TelegramLoginErrorCode>(["verification_failed", "unsupported_algorithm", "expired", "denied"]);

function errorCodeOf(cause: unknown): TelegramLoginErrorCode {
  const code = (cause as { data?: { error?: unknown } } | undefined)?.data?.error;
  return SERVER_ERROR_CODES.has(code as TelegramLoginErrorCode) ? (code as TelegramLoginErrorCode) : "provider_error";
}

export function useTelegramLogin(options: UseTelegramLoginOptions = {}): UseTelegramLogin {
  const route = useRoute();
  const telegramAuth = (useRuntimeConfig().public.telegramAuth ?? {}) as { clientId?: unknown; scope?: unknown; loginPath?: string; redirectAfterLogin?: string };
  const clientId = telegramAuth.clientId ? String(telegramAuth.clientId) : "";
  const pages = { loginPath: telegramAuth.loginPath || DEFAULT_LOGIN_PATH, redirectAfterLogin: telegramAuth.redirectAfterLogin || DEFAULT_REDIRECT_AFTER_LOGIN };
  const mode = options.mode ?? "popup";
  const scope = normalizeScope(options.scope ?? telegramAuth.scope);

  const pending = ref(false);
  const error = ref<TelegramLoginErrorCode | null>(null);

  function fail(code: TelegramLoginErrorCode) {
    pending.value = false;
    error.value = code;
    options.onError?.(code);
  }

  const consumer: LoginConsumer = {
    async onResult(result) {
      if (!result.id_token) return fail(result.error === "popup_closed" ? "popup_closed" : "provider_error");
      try {
        const session = await loginWithIdToken(result.id_token);
        pending.value = false;
        error.value = null;
        options.onSuccess?.(session.user);
        const target = resolvePostLoginTarget(route, { mode, redirectTo: options.redirectTo }, pages);
        if (target) await navigateTo(target);
      } catch (cause) {
        fail(errorCodeOf(cause));
      }
    },
    onUnavailable: () => fail("sdk_load_failed"),
  };

  let disconnect: (() => void) | undefined;
  onMounted(() => {
    if (!clientId) {
      error.value = "not_configured";
      return;
    }
    if (mode === "redirect") return;
    disconnect = connectTelegramSdk(consumer);
    prepareTelegramSdk(clientId).catch(() => fail("sdk_load_failed"));
  });
  onBeforeUnmount(() => disconnect?.());

  function login() {
    error.value = null;
    if (!clientId) return fail("not_configured");

    if (mode === "redirect") {
      pending.value = true;
      const target = resolvePostLoginTarget(route, { mode, redirectTo: options.redirectTo }, pages) ?? route.fullPath;
      window.location.assign(`/auth/telegram?redirect=${encodeURIComponent(target)}`);
      return;
    }

    pending.value = true;
    const outcome = openTelegramSdk(consumer, scope, options.lang);
    if (outcome === "blocked") fail("popup_blocked");
    else if (outcome === "unavailable") {
      fail("sdk_load_failed");
      // The popup can't wait for this, but the next click can use it.
      prepareTelegramSdk(clientId).catch(() => {});
    }
  }

  return {
    ready: computed(() => !!clientId && (mode === "redirect" || telegramSdkReady.value)),
    pending: readonly(pending),
    error: readonly(error),
    login,
  };
}
