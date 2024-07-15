import { defineNuxtModule, createResolver, addComponent, addServerHandler, addImportsDir } from "@nuxt/kit";

export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-telegram-auth",
    configKey: "telegramAuth",
  },

  defaults: {},
  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url);

    addImportsDir(resolver.resolve("./runtime/app/composables"));

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
      handler: resolver.resolve("runtime/server/api/telegram/session.delete"),
      route: "/api/telegram/session",
      method: "delete",
    });
  },
});
