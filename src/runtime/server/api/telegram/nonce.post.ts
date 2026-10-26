import { createError, defineEventHandler, setResponseStatus } from "nuxt/server";
import { useTelegramConfig } from "../../lib/config";
import { assertOidcConfigured } from "../../lib/oidc";
import { noStore, refuseLoginPost } from "../../lib/request";
import { issueNonce } from "../../lib/transaction";

export default defineEventHandler(async (event): Promise<{ nonce?: string }> => {
  noStore(event);
  const refused = refuseLoginPost(event);
  if (refused) {
    setResponseStatus(event, refused);
    return {};
  }

  try {
    assertOidcConfigured(useTelegramConfig(), "sdk");
  } catch (error) {
    throw createError({ status: 500, message: (error as Error).message });
  }
  return { nonce: await issueNonce(event) };
});
