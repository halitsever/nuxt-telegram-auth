<template>
  <p>cached page: {{ ready ? (user?.first_name ?? "nobody") : "loading" }}</p>
</template>

<script setup lang="ts">
const { user, ready } = useTelegramSession();
</script>
