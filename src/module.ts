import { defineNuxtModule, createResolver, addComponent, addServerHandler, addImportsDir, addServerImports, addTypeTemplate, useLogger } from "@nuxt/kit";
import { defu } from "defu";
import { DEFAULT_LOGIN_PATH, DEFAULT_REDIRECT_AFTER_LOGIN, DEFAULT_SESSION_MAX_AGE, DEFAULT_SESSION_NAME, TELEGRAM_OIDC } from "./runtime/shared/defaults";
import type { RawTelegramConfig } from "./runtime/server/lib/config";
import { collectConfigWarnings } from "./warnings";

export type { TelegramLoginErrorCode, TelegramProvider, TelegramSession, TelegramSessionResponse, TelegramUser } from "./runtime/shared/types";
export type { TelegramErrorHookContext, TelegramLoginHookContext, TelegramLogoutHookContext, TelegramSessionHookContext } from "./runtime/server/hooks";

export interface ModuleOptions {
  session?: {
    /** Cookie name. */
    name?: string;
    /** Seconds. */
    maxAge?: number;
    /** Applied over the HttpOnly, Secure and SameSite=Lax defaults, e.g. `secure: false` to test over plain HTTP on a LAN. */
    cookie?: { domain?: string; secure?: boolean; sameSite?: "lax" | "strict" | "none" };
  };
  /** @deprecated Use `session.maxAge`. */
  sessionMaxAge?: number;
  /** `profile` is always requested; this adds more. */
  scope?: ("phone" | "write")[];
  loginPath?: string;
  redirectAfterLogin?: string;
  protectAll?: boolean;
  compat?: { useUserSession?: boolean; migrateLegacyCookie?: boolean };
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-telegram-auth",
    configKey: "telegramAuth",
    compatibility: {
      nuxt: ">=4.6.0",
    },
  },

  defaults: {
    scope: [],
    loginPath: DEFAULT_LOGIN_PATH,
    redirectAfterLogin: DEFAULT_REDIRECT_AFTER_LOGIN,
    protectAll: false,
    compat: { useUserSession: true, migrateLegacyCookie: true },
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    // Every key needs a default: Nitro only applies env overrides to keys that exist.
    nuxt.options.runtimeConfig.TELEGRAM_TOKEN ??= "";
    nuxt.options.runtimeConfig.telegramAuth = defu(nuxt.options.runtimeConfig.telegramAuth, {
      botToken: "",
      clientSecret: "",
      sessionPassword: "",
      redirectUrl: "",
      migrateLegacyCookie: options.compat?.migrateLegacyCookie ?? true,
      oidc: { ...TELEGRAM_OIDC, jwks: "" },
      session: {
        name: options.session?.name ?? DEFAULT_SESSION_NAME,
        maxAge: options.session?.maxAge ?? options.sessionMaxAge ?? DEFAULT_SESSION_MAX_AGE,
        cookie: options.session?.cookie ?? {},
      },
    });
    nuxt.options.runtimeConfig.public.telegramAuth = defu(nuxt.options.runtimeConfig.public.telegramAuth as Record<string, unknown> | undefined, {
      clientId: "",
      scope: options.scope ?? [],
      loginPath: options.loginPath ?? DEFAULT_LOGIN_PATH,
      redirectAfterLogin: options.redirectAfterLogin ?? DEFAULT_REDIRECT_AFTER_LOGIN,
      protectAll: options.protectAll ?? false,
    });

    if (nuxt.options.dev) {
      const logger = useLogger("nuxt-telegram-auth");
      const runtimeConfig = nuxt.options.runtimeConfig as RawTelegramConfig;
      for (const warning of collectConfigWarnings({ options, runtimeConfig, env: process.env })) logger.warn(warning);
    }

    // The hooks file declares the telegram-auth:* hooks on NuxtServerHooks.
    addTypeTemplate(
      {
        filename: "types/nuxt-telegram-auth.d.ts",
        getContents: () => `import type { TelegramLoginHookContext } from ${JSON.stringify(resolver.resolve("./runtime/server/hooks"))};\nexport {};\n`,
      },
      { nuxt: true, nitro: true },
    );

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
