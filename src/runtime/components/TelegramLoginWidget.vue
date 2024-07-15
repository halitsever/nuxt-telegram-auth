<template>
  <div id="telegram"></div>
</template>

<script setup>
const props = defineProps({
  mode: {
    type: String,
    default: "callback",
  },
  telegramLogin: {
    type: String,
    required: true,
  },
  redirectUrl: {
    type: String,
    default: "",
  },
  requestAccess: {
    type: String,
    default: "read",
  },
  size: {
    type: String,
    default: "medium",
  },
  userpic: {
    type: Boolean,
    default: true,
  },
  radius: {
    type: String,
  },
});

import { onMounted } from "vue";
import { fetchSession } from "../app/composables/session";
import { useCookie } from "#app";

const emit = defineEmits(["callback", "loaded"]);

const userCookie = useCookie("tg_user", {
  maxAge: 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
});

const setCookie = (payload) => {
  userCookie.value = btoa(JSON.stringify(payload));
};

function onTelegramAuth(payload) {
  setCookie(payload);
  fetchSession();
  emit("callback", payload);
}

onMounted(() => {
  if (process.client) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?3";

    script.setAttribute("data-telegram-login", props.telegramLogin);
    script.setAttribute("data-request-access", props.requestAccess);
    script.setAttribute("data-size", props.size);
    script.setAttribute("data-userpic", props.userpic);

    if (props.radius) script.setAttribute("data-radius", props.radius);

    if (props.mode === "callback") {
      window.onTelegramAuth = onTelegramAuth;
      script.setAttribute("data-onauth", "window.onTelegramAuth(user)");
    } else {
      script.setAttribute("data-auth-url", props.redirectUrl);
    }

    document.querySelector("#telegram").appendChild(script);
    emit("loaded");
  }
});
</script>
