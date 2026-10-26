import { useRuntimeConfig } from "nuxt/server";
import { DEFAULT_LOGIN_PATH, DEFAULT_REDIRECT_AFTER_LOGIN, DEFAULT_SESSION_MAX_AGE, DEFAULT_SESSION_NAME, TELEGRAM_OIDC, normalizeScope } from "../../shared/defaults";

export interface TelegramAuthConfig {
  botToken: string;
  clientId: string;
  clientSecret: string;
  sessionPassword: string;
  redirectUrl: string;
  oidc: { issuer: string; authorizationEndpoint: string; tokenEndpoint: string; jwksUri: string; jwks: string };
  session: { name: string; maxAge: number; cookie: Record<string, unknown> };
  scope: string[];
  loginPath: string;
  redirectAfterLogin: string;
  migrateLegacyCookie: boolean;
}

/** Runtime config as Nitro hands it over, before any of it is trusted. */
export interface RawTelegramConfig {
  TELEGRAM_TOKEN?: unknown;
  telegramAuth?: {
    botToken?: unknown;
    clientSecret?: unknown;
    sessionPassword?: unknown;
    redirectUrl?: unknown;
    migrateLegacyCookie?: unknown;
    oidc?: { issuer?: unknown; authorizationEndpoint?: unknown; tokenEndpoint?: unknown; jwksUri?: unknown; jwks?: unknown };
    session?: { name?: unknown; maxAge?: unknown; cookie?: Record<string, unknown> };
  };
  public?: { telegramAuth?: { clientId?: unknown; scope?: unknown; loginPath?: unknown; redirectAfterLogin?: unknown } };
}

/** Nitro parses env overrides, so ids and secrets can arrive as numbers. */
function text(value: unknown, fallback = ""): string {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function json(value: unknown): string {
  if (!value) return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}

export function resolveTelegramConfig(runtimeConfig: RawTelegramConfig): TelegramAuthConfig {
  const server = runtimeConfig.telegramAuth ?? {};
  const shared = runtimeConfig.public?.telegramAuth ?? {};
  const oidc = server.oidc ?? {};
  const session = server.session ?? {};
  return {
    botToken: text(server.botToken) || text(runtimeConfig.TELEGRAM_TOKEN),
    clientId: text(shared.clientId),
    clientSecret: text(server.clientSecret),
    sessionPassword: text(server.sessionPassword),
    redirectUrl: text(server.redirectUrl),
    oidc: {
      issuer: text(oidc.issuer, TELEGRAM_OIDC.issuer),
      authorizationEndpoint: text(oidc.authorizationEndpoint, TELEGRAM_OIDC.authorizationEndpoint),
      tokenEndpoint: text(oidc.tokenEndpoint, TELEGRAM_OIDC.tokenEndpoint),
      jwksUri: text(oidc.jwksUri, TELEGRAM_OIDC.jwksUri),
      jwks: json(oidc.jwks),
    },
    session: {
      name: text(session.name, DEFAULT_SESSION_NAME),
      maxAge: Number(session.maxAge) || DEFAULT_SESSION_MAX_AGE,
      cookie: session.cookie ?? {},
    },
    scope: normalizeScope(shared.scope),
    loginPath: text(shared.loginPath, DEFAULT_LOGIN_PATH),
    redirectAfterLogin: text(shared.redirectAfterLogin, DEFAULT_REDIRECT_AFTER_LOGIN),
    migrateLegacyCookie: server.migrateLegacyCookie !== false,
  };
}

export function useTelegramConfig(): TelegramAuthConfig {
  return resolveTelegramConfig(useRuntimeConfig() as RawTelegramConfig);
}
