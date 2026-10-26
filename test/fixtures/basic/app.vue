<template>
  <div>
    <div>basic</div>
    <p id="session-state">{{ loggedIn ? `logged in as ${user?.first_name}` : "logged out" }}</p>
    <TelegramLoginWidget telegram-login="test_bot" />
  </div>
</template>

<script setup lang="ts">
const { user, loggedIn } = useTelegramSession();
</script>
