<template>
  <div>
    <div>basic</div>
    <p id="session-state">{{ session.loggedIn ? `logged in as ${session.first_name}` : "logged out" }}</p>
    <TelegramLoginWidget telegram-login="test_bot" />
  </div>
</template>

<script setup lang="ts">
const { session } = useUserSession();
</script>
