<template>
  <div class="tlg">
    <fieldset class="tlg-kind">
      <legend>Component</legend>
      <label><input v-model="kind" type="radio" value="button" /> Telegram Login button <code>&lt;TelegramLoginButton&gt;</code></label>
      <label><input v-model="kind" type="radio" value="widget" /> Legacy widget <code>&lt;TelegramLoginWidget&gt;</code></label>
    </fieldset>

    <div v-if="kind === 'button'" class="tlg-grid">
      <label class="tlg-field">
        <span>Client ID (bot id)</span>
        <input v-model.trim="clientId" inputmode="numeric" placeholder="123456789" />
      </label>
      <label class="tlg-field">
        <span>Login mode</span>
        <select v-model="mode">
          <option value="popup">Popup (default)</option>
          <option value="redirect">Redirect to Telegram</option>
        </select>
      </label>
      <div class="tlg-field">
        <span>Button style</span>
        <div class="tlg-checks">
          <label v-for="v in variants" :key="v"><input v-model="variant" type="checkbox" :value="v" /> {{ v }}</label>
        </div>
      </div>
      <div class="tlg-field">
        <span>Extra permissions</span>
        <div class="tlg-checks">
          <label><input v-model="scope" type="checkbox" value="write" /> write (bot may message the user)</label>
          <label><input v-model="scope" type="checkbox" value="phone" /> phone number</label>
        </div>
      </div>
      <label class="tlg-field">
        <span>Language of Telegram's screen</span>
        <input v-model.trim="lang" placeholder="en, tr, es..." maxlength="10" />
      </label>
      <label class="tlg-field">
        <span>Redirect after login</span>
        <input v-model.trim="redirectTo" placeholder="/dashboard" />
      </label>
    </div>

    <div v-else class="tlg-grid">
      <label class="tlg-field">
        <span>Bot username</span>
        <input v-model.trim="botName" placeholder="my_bot" />
      </label>
      <label class="tlg-field">
        <span>Button size</span>
        <select v-model="size">
          <option value="large">large</option>
          <option value="medium">medium (default)</option>
          <option value="small">small</option>
        </select>
      </label>
      <label class="tlg-field">
        <span>Corner radius (px, empty for Telegram's default)</span>
        <input v-model.trim="radius" type="number" min="0" placeholder="default" />
      </label>
      <div class="tlg-field">
        <span>Options</span>
        <div class="tlg-checks">
          <label><input v-model="userpic" type="checkbox" /> show user photo</label>
          <label><input v-model="requestWrite" type="checkbox" /> request write access</label>
        </div>
      </div>
      <label class="tlg-field">
        <span>Authorization type</span>
        <select v-model="widgetMode">
          <option value="callback">Callback (default)</option>
          <option value="redirect">Redirect to URL</option>
        </select>
      </label>
      <label class="tlg-field">
        <span>Redirect after login (redirect mode)</span>
        <input v-model.trim="redirectTo" placeholder="/dashboard" :disabled="widgetMode !== 'redirect'" />
      </label>
      <label class="tlg-field">
        <span>Button language</span>
        <input v-model.trim="lang" placeholder="en, tr, es..." maxlength="10" />
      </label>
    </div>

    <p v-for="note in notes" :key="note" class="tlg-note">{{ note }}</p>

    <div v-for="block in blocks" :key="block.name" class="tlg-out">
      <div class="tlg-out-head">
        <span>{{ block.name }}</span>
        <button type="button" @click="copy(block)">{{ copied === block.name ? "Copied" : "Copy" }}</button>
      </div>
      <pre><code>{{ block.code }}</code></pre>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const variants = ["square", "outlined", "icon", "shine"];
const kind = ref("button");
const clientId = ref("");
const mode = ref("popup");
const variant = ref([]);
const scope = ref([]);
const lang = ref("");
const redirectTo = ref("");
const botName = ref("");
const size = ref("medium");
const radius = ref("");
const userpic = ref(true);
const requestWrite = ref(false);
const widgetMode = ref("callback");
const copied = ref("");

const attr = (value) => value.replace(/["<>]/g, "");
/** Only site paths are followed by the module, anything else falls back to redirectAfterLogin. */
const sitePath = computed(() => (redirectTo.value.startsWith("/") && !redirectTo.value.startsWith("//") ? redirectTo.value : ""));

const buttonCode = computed(() => {
  const props = [];
  if (mode.value === "redirect") props.push('mode="redirect"');
  if (sitePath.value) props.push(`redirect-to="${attr(sitePath.value)}"`);
  if (variant.value.length === 1) props.push(`variant="${variant.value[0]}"`);
  if (variant.value.length > 1) props.push(`:variant="[${variant.value.map((v) => `'${v}'`).join(", ")}]"`);
  if (lang.value && mode.value === "popup") props.push(`lang="${attr(lang.value)}"`);
  return `<template>\n  <TelegramLoginButton${props.length ? " " + props.join(" ") : ""} />\n</template>`;
});

const widgetCode = computed(() => {
  const name = botName.value.replace(/^@/, "") || "my_bot";
  const props = [`telegram-login="${attr(name)}"`];
  if (size.value !== "medium") props.push(`size="${size.value}"`);
  if (radius.value !== "") props.push(`radius="${Math.max(0, Math.round(Number(radius.value) || 0))}"`);
  if (!userpic.value) props.push(':userpic="false"');
  if (requestWrite.value) props.push('request-access="write"');
  if (widgetMode.value === "redirect") {
    props.push('mode="redirect"');
    if (sitePath.value) props.push(`redirect-to="${attr(sitePath.value)}"`);
  }
  if (lang.value) props.push(`lang="${attr(lang.value)}"`);
  const callback = widgetMode.value === "callback" ? ' @callback="onLogin"' : "";
  const script = widgetMode.value === "callback" ? `\n\n<script setup lang="ts">\nconst onLogin = () => navigateTo("/");\n</${"script"}>` : "";
  return `<template>\n  <TelegramLoginWidget ${props.join(" ")}${callback} />\n</template>${script}`;
});

const configCode = computed(() => {
  const options = [];
  if (kind.value === "button" && scope.value.length) options.push(`    scope: [${scope.value.map((s) => `"${s}"`).join(", ")}],`);
  options.push('    loginPath: "/login",', '    redirectAfterLogin: "/",');
  return `export default defineNuxtConfig({\n  modules: ["nuxt-telegram-auth"],\n  telegramAuth: {\n${options.join("\n")}\n  },\n});`;
});

const envCode = computed(() => {
  const lines = ["NUXT_APP_SECRET=at-least-32-random-characters"];
  if (kind.value === "button") {
    lines.push(`NUXT_PUBLIC_TELEGRAM_AUTH_CLIENT_ID=${clientId.value.replace(/\D/g, "") || "123456789"}`);
    if (mode.value === "redirect") lines.push("NUXT_TELEGRAM_AUTH_CLIENT_SECRET=your_client_secret");
  } else {
    lines.push("NUXT_TELEGRAM_AUTH_BOT_TOKEN=123456:your_bot_token");
  }
  return lines.join("\n");
});

const blocks = computed(() => [
  { name: kind.value === "button" ? "pages/login.vue" : "components/Login.vue", code: kind.value === "button" ? buttonCode.value : widgetCode.value },
  { name: "nuxt.config.ts", code: configCode.value },
  { name: ".env", code: envCode.value },
]);

const notes = computed(() => {
  const out = [];
  if (redirectTo.value && !sitePath.value) out.push("Redirect after login must be a path on your site, such as /dashboard. Other values are left out.");
  if (kind.value === "button") {
    out.push("Scopes go in nuxt.config, where both the popup and the redirect login read them.");
    if (mode.value === "redirect") out.push("The redirect login needs the Client Secret and the callback https://your-site/auth/telegram/callback in Allowed URLs. The language option only applies to the popup.");
  } else {
    out.push("The legacy widget stops working once the bot turns on Telegram Login. Use it only for bots that have not switched.");
    if (widgetMode.value === "redirect") out.push("Widget redirect mode has no state parameter. Callback mode is the safer choice.");
  }
  return out;
});

async function copy(block) {
  try {
    await navigator.clipboard.writeText(block.code);
    copied.value = block.name;
    setTimeout(() => (copied.value = ""), 1500);
  } catch {
    copied.value = "";
  }
}
</script>

<style scoped>
.tlg {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  background: var(--vp-c-bg-soft);
}
.tlg fieldset {
  border: 0;
  padding: 0;
  margin: 0 0 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
}
.tlg legend,
.tlg-field > span {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-bottom: 4px;
  display: block;
}
.tlg label {
  font-size: 14px;
}
.tlg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px 20px;
}
.tlg-field {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.tlg input:not([type="radio"]):not([type="checkbox"]),
.tlg select {
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 6px 10px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  width: 100%;
}
.tlg input:disabled {
  opacity: 0.5;
}
.tlg-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}
.tlg-note {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin: 12px 0 0;
}
.tlg-out {
  margin-top: 16px;
}
.tlg-out-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-family: var(--vp-font-family-mono);
}
.tlg-out-head button {
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 2px 10px;
  font-size: 12px;
  background: var(--vp-c-bg);
}
.tlg-out pre {
  margin: 6px 0 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--vp-code-block-bg);
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.5;
}
.tlg-out code {
  font-family: var(--vp-font-family-mono);
  white-space: pre;
}
</style>
