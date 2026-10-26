import { createError, defineEventHandler, getQuery, getRequestURL, sendRedirect } from "nuxt/server";
import { safeRedirect } from "../../../shared/redirect";
import { useTelegramConfig } from "../../lib/config";
import { assertOidcConfigured, buildAuthorizationUrl, resolveRedirectUri } from "../../lib/oidc";
import { codeChallengeS256 } from "../../lib/pkce";
import { noStore } from "../../lib/request";
import { startOidcTransaction } from "../../lib/transaction";

export default defineEventHandler(async (event) => {
  noStore(event);
  const config = useTelegramConfig();
  try {
    assertOidcConfigured(config, "redirect");
  } catch (error) {
    // Only a developer can fix this, so say what's missing instead of sending the user in a circle.
    throw createError({ status: 500, message: (error as Error).message });
  }

  const transaction = await startOidcTransaction(event, safeRedirect(getQuery(event).redirect, config.redirectAfterLogin));
  const redirectUri = resolveRedirectUri(getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }), config);
  const challenge = await codeChallengeS256(transaction.verifier);
  return sendRedirect(event, buildAuthorizationUrl(config, { state: transaction.state, nonce: transaction.nonce, challenge, redirectUri }), 302);
});
