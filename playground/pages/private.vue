<template>
  <p>Only logged-in users see this, {{ user?.first_name }}.</p>
</template>

<script setup lang="ts">
definePageMeta({ telegramAuth: true });

const { user } = useTelegramSession();
</script>
