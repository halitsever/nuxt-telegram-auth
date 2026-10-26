import { defineEventHandler, getQuery, getRequestURL, isNuxtError, sendRedirect } from "nuxt/server";
import type { RequestEvent } from "nuxt/server";
import { userFromOidcClaims } from "../../../shared/normalize";
import type { TelegramLoginErrorCode } from "../../../shared/types";
import { useTelegramConfig } from "../../lib/config";
import { TelegramAuthError } from "../../lib/errors";
import { verifyIdToken } from "../../lib/jwt";
import { exchangeCode, resolveRedirectUri } from "../../lib/oidc";
import { completeLogin, reportLoginError } from "../../lib/pipeline";
import { timingSafeEqualString } from "../../lib/pkce";
import { noStore } from "../../lib/request";
import { readTelegramSession } from "../../lib/store";
import { clearOidcTransaction, readOidcTransaction } from "../../lib/transaction";

function errorCode(error: unknown): TelegramLoginErrorCode {
  if (error instanceof TelegramAuthError) return error.code;
  if (isNuxtError(error) && error.status === 403) return "denied";
  return "provider_error";
}

/** Each step throws a TelegramAuthError; the handler turns it into a redirect to the login page. */
async function finishLogin(event: RequestEvent): Promise<string> {
  const config = useTelegramConfig();
  const query = getQuery(event);
  if (query.error) throw new TelegramAuthError("provider_error", 400, `Telegram answered "${String(query.error)}".`);

  const transaction = await readOidcTransaction(event);
  if (!transaction) {
    // A reload of this page after a finished login lands here too; that's not worth an error.
    if (await readTelegramSession(event)) return config.redirectAfterLogin;
    throw new TelegramAuthError("expired", 400, "The login took too long or already finished. Start it again.");
  }
  if (typeof query.state !== "string" || !timingSafeEqualString(query.state, transaction.state)) {
    throw new TelegramAuthError("invalid_state", 400, "The login came back with a state this browser didn't start.");
  }
  await clearOidcTransaction(event);
  if (typeof query.code !== "string") throw new TelegramAuthError("provider_error", 400, "Telegram sent no authorization code.");

  const redirectUri = resolveRedirectUri(getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }), config);
  const idToken = await exchangeCode(config, { code: query.code, redirectUri, verifier: transaction.verifier });
  const claims = await verifyIdToken(idToken, { config, nonce: transaction.nonce });
  const user = userFromOidcClaims(claims);
  if (!user) throw new TelegramAuthError("verification_failed", 401, "The id_token carries no Telegram user id. The profile scope is missing.");

  await completeLogin(event, { provider: "oidc", user, claims, sub: typeof claims.sub === "string" ? claims.sub : undefined });
  return transaction.redirect;
}

export default defineEventHandler(async (event) => {
  noStore(event);
  // The query holds the authorization code; it must not leak to the next page through Referer.
  event.res.headers.set("referrer-policy", "no-referrer");

  try {
    return sendRedirect(event, await finishLogin(event), 302);
  } catch (error) {
    await reportLoginError(event, "oidc", error);
    const { loginPath } = useTelegramConfig();
    return sendRedirect(event, `${loginPath}${loginPath.includes("?") ? "&" : "?"}telegram_error=${errorCode(error)}`, 302);
  }
});
