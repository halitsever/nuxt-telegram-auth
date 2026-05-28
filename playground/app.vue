<template>
  <div style="font-family: sans-serif; max-width: 480px; margin: 60px auto; padding: 0 16px;">
    <div v-if="loading">
      <p>Loading session...</p>
    </div>

    <div v-else-if="session.loggedIn">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <img
          v-if="session.photo_url"
          :src="session.photo_url"
          alt="Profile photo"
          style="width: 48px; height: 48px; border-radius: 50%;"
        >
        <div>
          <strong>{{ session.first_name }} {{ session.last_name }}</strong>
          <p v-if="session.username" style="margin: 0; color: #666;">@{{ session.username }}</p>
        </div>
      </div>

      <p v-if="error" style="color: red;">{{ error }}</p>

      <div style="display: flex; gap: 8px;">
        <button @click="refresh">Refresh Session</button>
        <button @click="logout">Logout</button>
      </div>

      <details style="margin-top: 16px;">
        <summary style="cursor: pointer; color: #666;">Raw session data</summary>
        <pre style="font-size: 12px; background: #f5f5f5; padding: 8px; border-radius: 4px;">{{ session }}</pre>
      </details>
    </div>

    <div v-else>
      <p v-if="error" style="color: red;">{{ error }}</p>
      <p>Login with Telegram:</p>
      <TelegramLoginWidget telegram-login="my_bot" @callback="testCallback" />
    </div>
  </div>
</template>

<script setup>
const { clearSession, session, loading, error, refresh } = useUserSession();
const logout = () => clearSession();
const testCallback = (user) => console.log("Telegram callback:", user);
</script>
