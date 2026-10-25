import { defineNuxtModule, createResolver, addComponent, addServerHandler, addImportsDir, addServerImports, useLogger } from "@nuxt/kit";
import { defu } from "defu";

export type { ITelegramSession, ITelegramUser, IUserSession } from "./runtime/types/session";

export interface ModuleOptions {
  sessionMaxAge?: number;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-telegram-auth",
    configKey: "telegramAuth",
    compatibility: {
      nuxt: ">=4.0.0",
    },
  },

  defaults: {
    sessionMaxAge: 60 * 60 * 24, // 24 hours
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    const sessionMaxAge = options.sessionMaxAge ?? 60 * 60 * 24;

    nuxt.options.runtimeConfig.TELEGRAM_TOKEN ??= "";
    const telegramAuth = defu(nuxt.options.runtimeConfig.telegramAuth, { botToken: "", sessionMaxAge });
    nuxt.options.runtimeConfig.telegramAuth = telegramAuth;

    const hasBotToken = telegramAuth.botToken || nuxt.options.runtimeConfig.TELEGRAM_TOKEN || process.env.NUXT_TELEGRAM_AUTH_BOT_TOKEN || process.env.NUXT_TELEGRAM_TOKEN;
    if (nuxt.options.dev && !hasBotToken) {
      useLogger("nuxt-telegram-auth").warn("No Telegram bot token found. Set NUXT_TELEGRAM_AUTH_BOT_TOKEN in your .env file.");
    }

    addImportsDir(resolver.resolve("./runtime/app/composables"));

    addServerImports([
      {
        name: "getTelegramSession",
        from: resolver.resolve("runtime/server/utils/telegram"),
      },
      {
        name: "requireTelegramSession",
        from: resolver.resolve("runtime/server/utils/telegram"),
      },
    ]);

    addComponent({
      name: "TelegramLoginWidget",
      filePath: resolver.resolve("runtime/components/TelegramLoginWidget.vue"),
    });

    addServerHandler({
      handler: resolver.resolve("runtime/server/api/telegram/session.get"),
      route: "/api/telegram/session",
      method: "get",
    });

    addServerHandler({
      handler: resolver.resolve("runtime/server/api/telegram/session.post"),
      route: "/api/telegram/session",
      method: "post",
    });

    addServerHandler({
      handler: resolver.resolve("runtime/server/api/telegram/session.delete"),
      route: "/api/telegram/session",
      method: "delete",
    });

    addServerHandler({
      handler: resolver.resolve("runtime/server/api/telegram/callback.get"),
      route: "/api/telegram/callback",
      method: "get",
    });
  },
});
