import type { TelegramAuthConfig } from "./config";
import { TelegramAuthError } from "./errors";

/** The SDK says `write`; Telegram's OIDC endpoint calls the same scope `telegram:bot_access`. */
const OIDC_SCOPE_NAMES: Record<string, string> = { write: "telegram:bot_access" };

export function assertOidcConfigured(config: TelegramAuthConfig, flow: "sdk" | "redirect"): void {
  if (!config.clientId) throw new TelegramAuthError("not_configured", 500, "Set NUXT_PUBLIC_TELEGRAM_AUTH_CLIENT_ID to use Telegram Login.");
  if (flow === "redirect" && !config.clientSecret) throw new TelegramAuthError("not_configured", 500, "Set NUXT_TELEGRAM_AUTH_CLIENT_SECRET to use the redirect login.");
}

/** Pass the request URL with forwarded headers applied, so a proxied app sends its public address. */
export function resolveRedirectUri(requestUrl: URL, config: TelegramAuthConfig): string {
  return config.redirectUrl || `${requestUrl.origin}/auth/telegram/callback`;
}

export function buildAuthorizationUrl(config: TelegramAuthConfig, input: { state: string; nonce: string; challenge: string; redirectUri: string }): string {
  const url = new URL(config.oidc.authorizationEndpoint);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: input.redirectUri,
    scope: ["openid", ...config.scope.map((scope) => OIDC_SCOPE_NAMES[scope] ?? scope)].join(" "),
    state: input.state,
    nonce: input.nonce,
    code_challenge: input.challenge,
    code_challenge_method: "S256",
  }).toString();
  return url.toString();
}

/** Trades the code for an id_token. Telegram's access token is useless without a userinfo endpoint, so it's dropped. */
export async function exchangeCode(config: TelegramAuthConfig, input: { code: string; redirectUri: string; verifier: string }): Promise<string> {
  let response: Response;
  try {
    response = await fetch(config.oidc.tokenEndpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "authorization_code", code: input.code, redirect_uri: input.redirectUri, client_id: config.clientId, code_verifier: input.verifier }),
    });
  } catch (error) {
    throw new TelegramAuthError("provider_error", 502, `Telegram's token endpoint is unreachable: ${(error as Error).message}`);
  }

  const body = (await response.json().catch(() => ({}))) as { id_token?: unknown; error?: unknown };
  if (!response.ok || typeof body.id_token !== "string") {
    throw new TelegramAuthError("provider_error", 502, `Telegram's token endpoint answered ${response.status}${body.error ? ` (${String(body.error)})` : ""} without an id_token.`);
  }
  return body.id_token;
}
