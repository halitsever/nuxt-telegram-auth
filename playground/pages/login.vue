<template>
  <div style="display: flex; flex-direction: column; gap: 16px; align-items: flex-start">
    <p v-if="route.query.telegram_error" style="color: red">The login failed: {{ route.query.telegram_error }}</p>

    <TelegramLoginButton @error="(code) => console.warn('Telegram login failed:', code)" />
    <TelegramLoginButton mode="redirect" variant="outlined">Log in with a redirect</TelegramLoginButton>

    <label><input v-model="showWidget" type="checkbox"> Show the old login widget</label>
    <TelegramLoginWidget v-if="showWidget && botUsername" :telegram-login="botUsername" />
    <p v-else-if="showWidget">Set NUXT_PUBLIC_BOT_USERNAME to show the widget.</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ telegramAuth: "guest" });

const route = useRoute();
const showWidget = ref(false);
const botUsername = useRuntimeConfig().public.botUsername;
</script>
