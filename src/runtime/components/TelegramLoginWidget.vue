<template>
  <div id="telegram" ref="container" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "#app";
import { useSessionState } from "../app/composables/session";
import type { ITelegramSession, ITelegramUser } from "../types/session";

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
  callback: [user: ITelegramUser];
  loaded: [];
}>();

const container = ref<HTMLDivElement>();
const session = useSessionState();
const route = useRoute();
/** The callback lives on window, so its name has to be unique across every Vue app on the page. */
const callbackName = `__telegramAuth_${Math.random().toString(36).slice(2)}`;
const callbacks = () => window as unknown as Record<string, unknown>;

async function onTelegramAuth(user: ITelegramUser) {
  try {
    session.value = await $fetch<ITelegramSession>("/api/telegram/session", { method: "POST", body: user });
  } catch {
    session.value = { loggedIn: false, status: 401 };
  }
  emit("callback", user);
}

onMounted(() => {
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
