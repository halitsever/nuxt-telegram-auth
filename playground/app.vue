<template>
  <div>
    <div>
      <div v-if="session.loggedIn">
        <button @click="logout">Logout</button>
        <a>Hey you are logged in!</a>
        <p>Session: {{ session }}</p>
      </div>
      <div v-else>
        <TelegramLoginWidget telegram-login="my_bot" @callback="testCallback" />
      </div>
    </div>
  </div>
</template>

<script setup>
const { clearSession, session } = useUserSession();
const logout = () => clearSession();
const testCallback = (user) => {
  console.log("Custom callback function: ", user);
};
</script>
