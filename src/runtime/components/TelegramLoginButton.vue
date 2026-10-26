<template>
  <button type="button" class="tg-auth-button" :data-style="dataStyle" :disabled="mode === 'popup' && !ready" @click="onClick">
    <slot>Log in with Telegram</slot>
  </button>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useTelegramLogin } from "../app/composables/login";
import { refreshTelegramSdkButtons } from "../app/utils/sdk";
import type { TelegramButtonStyle, TelegramLoginErrorCode, TelegramUser } from "../shared/types";

const props = withDefaults(
  defineProps<{
    scope?: ("phone" | "write")[];
    lang?: string;
    mode?: "popup" | "redirect";
    redirectTo?: string;
    variant?: TelegramButtonStyle | TelegramButtonStyle[];
  }>(),
  {
    scope: undefined,
    lang: undefined,
    mode: "popup",
    redirectTo: undefined,
    variant: undefined,
  },
);

const emit = defineEmits<{
  success: [user: TelegramUser];
  error: [code: TelegramLoginErrorCode];
}>();

const { ready, login } = useTelegramLogin({
  scope: props.scope,
  lang: props.lang,
  mode: props.mode,
  redirectTo: props.redirectTo,
  onSuccess: (user) => emit("success", user),
  onError: (code) => emit("error", code),
});

const dataStyle = computed(() => (props.variant ? [props.variant].flat().join(" ") : undefined));

function onClick(event: MouseEvent) {
  // The SDK opens a popup for every .tg-auth-button click on the page; this button opens its own, so the SDK must not see it.
  event.stopPropagation();
  login();
}

// The SDK styles only the buttons that exist when it initializes.
onMounted(refreshTelegramSdkButtons);
</script>
