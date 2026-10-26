<template>
  <div style="font-family: sans-serif; max-width: 480px; margin: 60px auto; padding: 0 16px">
    <nav style="display: flex; gap: 12px; margin-bottom: 24px">
      <NuxtLink to="/">Home</NuxtLink>
      <NuxtLink to="/private">Private page</NuxtLink>
      <NuxtLink v-if="!loggedIn" to="/login">Log in</NuxtLink>
      <button v-else @click="clear">Log out</button>
    </nav>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const { loggedIn, clear } = useTelegramSession();
</script>
