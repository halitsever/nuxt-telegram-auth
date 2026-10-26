export const TELEGRAM_OIDC = {
  issuer: "https://oauth.telegram.org",
  authorizationEndpoint: "https://oauth.telegram.org/auth",
  tokenEndpoint: "https://oauth.telegram.org/token",
  jwksUri: "https://oauth.telegram.org/.well-known/jwks.json",
};

export const DEFAULT_SESSION_NAME = "nuxt-telegram-auth";
export const DEFAULT_SESSION_MAX_AGE = 60 * 60 * 24;
export const DEFAULT_LOGIN_PATH = "/login";
export const DEFAULT_REDIRECT_AFTER_LOGIN = "/";

const OPTIONAL_SCOPES = new Set(["phone", "write"]);

/** `profile` is always first because only it carries the numeric user id. Env overrides may arrive as "phone write". */
export function normalizeScope(scope: unknown): string[] {
  const values = typeof scope === "string" ? scope.split(/[\s,]+/) : Array.isArray(scope) ? scope : [];
  return ["profile", ...new Set(values.filter((value) => OPTIONAL_SCOPES.has(value)))];
}
