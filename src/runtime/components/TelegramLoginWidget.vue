<template>
  <div ref="container" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRuntimeConfig } from "#app";
import { setTelegramSessionState, toTelegramSession } from "../app/composables/session";
import type { TelegramSessionResponse, TelegramWidgetUser } from "../shared/types";

const props = withDefaults(
  defineProps<{
    telegramLogin: string;
    mode?: "callback" | "redirect";
    redirectUrl?: string;
    redirectTo?: string;
    requestAccess?: "write" | "read";
    size?: "large" | "medium" | "small";
    userpic?: boolean;
    radius?: string;
    lang?: string;
  }>(),
  {
    mode: "callback",
    redirectUrl: undefined,
    redirectTo: undefined,
    requestAccess: undefined,
    size: "medium",
    userpic: true,
    radius: undefined,
    lang: undefined,
  },
);

const emit = defineEmits<{
  callback: [user: TelegramWidgetUser];
  loaded: [];
}>();

const container = ref<HTMLDivElement>();
const route = useRoute();
const telegramAuth = useRuntimeConfig().public.telegramAuth as { clientId?: unknown } | undefined;
/** The callback lives on window, so its name has to be unique across every Vue app on the page. */
const callbackName = `__telegramAuth_${Math.random().toString(36).slice(2)}`;
const callbacks = () => window as unknown as Record<string, unknown>;

async function onTelegramAuth(user: TelegramWidgetUser) {
  try {
    setTelegramSessionState(toTelegramSession(await $fetch<TelegramSessionResponse>("/api/telegram/session", { method: "POST", body: user })));
  } catch {
    setTelegramSessionState(null);
  }
  emit("callback", user);
}

onMounted(() => {
  // Once a bot moves to Telegram Login, Telegram answers this widget with "Bot domain invalid" on every domain.
  if (import.meta.dev && telegramAuth?.clientId) {
    console.warn("[nuxt-telegram-auth] Bots set up for Telegram Login (OIDC) can't use the legacy widget. Use `<TelegramLoginButton>` instead.");
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://telegram.org/js/telegram-widget.js?22";

  script.setAttribute("data-telegram-login", props.telegramLogin);
  script.setAttribute("data-size", props.size);
  script.setAttribute("data-userpic", String(props.userpic));
  if (props.requestAccess === "write") script.setAttribute("data-request-access", "write");
  if (props.radius) script.setAttribute("data-radius", props.radius);
  if (props.lang) script.setAttribute("data-lang", props.lang);

  if (props.mode === "redirect") {
    script.setAttribute("data-auth-url", props.redirectUrl || `/api/telegram/callback?redirect=${encodeURIComponent(props.redirectTo ?? route.fullPath)}`);
  } else {
    if (import.meta.dev && props.mode !== "callback") console.warn(`[nuxt-telegram-auth] Unknown mode "${props.mode}", using "callback".`);
    callbacks()[callbackName] = onTelegramAuth;
    script.setAttribute("data-onauth", `window.${callbackName}(user)`);
  }

  script.addEventListener("load", () => emit("loaded"));
  container.value?.appendChild(script);
});

onBeforeUnmount(() => {
  Reflect.deleteProperty(window, callbackName);
  container.value?.replaceChildren();
});
</script>
