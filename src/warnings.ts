import type { ModuleOptions } from "./module";
import type { RawTelegramConfig } from "./runtime/server/lib/config";

interface WarningInput {
  options: ModuleOptions;
  runtimeConfig: RawTelegramConfig;
  env: Record<string, string | undefined>;
}

/** nuxt-security's options, as far as the opener policy goes. */
export interface SecurityOptions {
  headers?: false | { crossOriginOpenerPolicy?: string | false };
}

/** The Telegram Login popup can't report back to a page that is `Cross-Origin-Opener-Policy: same-origin`, nuxt-security's default. */
export function coopWarning(security: SecurityOptions | undefined): string | undefined {
  const policy = security?.headers === false ? false : security?.headers?.crossOriginOpenerPolicy;
  if (policy === undefined || policy === "same-origin") {
    return "nuxt-security sets Cross-Origin-Opener-Policy to same-origin by default, which breaks the Telegram Login popup. Set it to same-origin-allow-popups on pages with a login button.";
  }
  return undefined;
}

/** Env overrides only apply at runtime, so `env` is checked alongside the build-time config. */
export function collectConfigWarnings({ options, runtimeConfig, env }: WarningInput): string[] {
  const warnings: string[] = [];
  const legacyToken = runtimeConfig.TELEGRAM_TOKEN || env.NUXT_TELEGRAM_TOKEN;
  const botToken = String(runtimeConfig.telegramAuth?.botToken || env.NUXT_TELEGRAM_AUTH_BOT_TOKEN || legacyToken || "");
  const clientId = String(runtimeConfig.public?.telegramAuth?.clientId || env.NUXT_PUBLIC_TELEGRAM_AUTH_CLIENT_ID || "");

  if (options.sessionMaxAge !== undefined) warnings.push("`sessionMaxAge` is deprecated. Use `session.maxAge`.");
  if (legacyToken) warnings.push("`TELEGRAM_TOKEN` is deprecated. Use NUXT_TELEGRAM_AUTH_BOT_TOKEN.");

  // Only the part before the colon is the bot id; the rest is the secret and must never reach a log.
  const colon = botToken.indexOf(":");
  const botId = colon > 0 ? botToken.slice(0, colon) : "";
  if (clientId && botId && botId !== clientId) {
    warnings.push(`The client id (${clientId}) doesn't match the bot id in the bot token (${botId}). Both must come from the same bot.`);
  }
  if (!clientId && !botToken) {
    warnings.push("Set NUXT_PUBLIC_TELEGRAM_AUTH_CLIENT_ID for Telegram Login, or NUXT_TELEGRAM_AUTH_BOT_TOKEN for the legacy widget.");
  }
  return warnings;
}
