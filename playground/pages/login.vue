<template>
  <div style="display: flex; flex-direction: column; gap: 16px; align-items: flex-start">
    <p v-if="error" style="color: red">The login failed: {{ error }}</p>

    <TelegramLoginButton @error="(code) => (loginError = code)" />
    <TelegramLoginButton mode="redirect" variant="outlined" @error="(code) => (loginError = code)">Log in with a redirect</TelegramLoginButton>

    <label><input v-model="showWidget" type="checkbox"> Show the old login widget</label>
    <TelegramLoginWidget v-if="showWidget && botUsername" :telegram-login="botUsername" />
    <p v-else-if="showWidget">Set NUXT_PUBLIC_BOT_USERNAME to show the widget.</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ telegramAuth: "guest" });

const route = useRoute();
const showWidget = ref(false);
// Popup errors come from the button; redirect errors come back in the query.
const loginError = ref<string>();
const error = computed(() => loginError.value ?? route.query.telegram_error);
const botUsername = useRuntimeConfig().public.botUsername;
</script>
