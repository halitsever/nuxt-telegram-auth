import { defineNuxtModule, createResolver, addComponent, addServerHandler, addImportsDir, addServerImports } from "@nuxt/kit";

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
    nuxt.options.runtimeConfig.telegramAuth = { sessionMaxAge };
    nuxt.options.runtimeConfig.public.telegramAuth = { sessionMaxAge };

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
