<template>
  <div>
    <p v-if="!ready">Loading session...</p>
    <template v-else-if="user">
      <div style="display: flex; align-items: center; gap: 12px">
        <img v-if="user.photo_url" :src="user.photo_url" alt="Profile photo" style="width: 48px; height: 48px; border-radius: 50%">
        <div>
          <strong>{{ user.first_name }} {{ user.last_name }}</strong>
          <p v-if="user.username" style="margin: 0; color: #666">@{{ user.username }}</p>
        </div>
      </div>
      <details style="margin-top: 16px">
        <summary style="cursor: pointer; color: #666">Raw session</summary>
        <pre style="font-size: 12px; background: #f5f5f5; padding: 8px; border-radius: 4px">{{ session }}</pre>
      </details>
    </template>
    <p v-else>Nobody is logged in.</p>
  </div>
</template>

<script setup lang="ts">
const { session, user, ready } = useTelegramSession();
</script>
