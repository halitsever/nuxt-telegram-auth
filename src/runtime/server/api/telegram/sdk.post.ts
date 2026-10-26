import { defineEventHandler, isNuxtError, readBody, setResponseStatus } from "nuxt/server";
import { userFromOidcClaims } from "../../../shared/normalize";
import type { TelegramLoginErrorCode, TelegramSessionResponse } from "../../../shared/types";
import { useTelegramConfig } from "../../lib/config";
import { TelegramAuthError } from "../../lib/errors";
import { verifyIdToken } from "../../lib/jwt";
import { completeLogin, reportLoginError } from "../../lib/pipeline";
import { noStore, refuseLoginPost } from "../../lib/request";
import { takeNonce } from "../../lib/transaction";

type SdkLoginResponse = TelegramSessionResponse | { loggedIn: false; error: TelegramLoginErrorCode };

export default defineEventHandler(async (event): Promise<SdkLoginResponse> => {
  noStore(event);
  const refused = refuseLoginPost(event);
  if (refused) {
    setResponseStatus(event, refused);
    return { loggedIn: false };
  }

  // Taken before verifying, so even a failed attempt uses the nonce up.
  const nonce = await takeNonce(event);
  try {
    if (!nonce) throw new TelegramAuthError("expired", 401, "The login took too long or already finished. Start it again.");
    const body = await readBody<{ id_token?: unknown }>(event);
    if (typeof body?.id_token !== "string") throw new TelegramAuthError("verification_failed", 401, "No id_token was sent.");

    // Only the verified token counts; the SDK's decoded `user` never reaches the server.
    const claims = await verifyIdToken(body.id_token, { config: useTelegramConfig(), nonce });
    const user = userFromOidcClaims(claims);
    if (!user) throw new TelegramAuthError("verification_failed", 401, "The id_token carries no Telegram user id. The profile scope is missing.");

    const session = await completeLogin(event, { provider: "sdk", user, claims, sub: typeof claims.sub === "string" ? claims.sub : undefined });
    return { loggedIn: true, ...session };
  } catch (error) {
    await reportLoginError(event, "sdk", error);
    if (error instanceof TelegramAuthError) {
      setResponseStatus(event, error.status);
      return { loggedIn: false, error: error.code };
    }
    if (isNuxtError(error) && error.status === 403) {
      setResponseStatus(event, 403);
      return { loggedIn: false, error: "denied" };
    }
    throw error;
  }
});
