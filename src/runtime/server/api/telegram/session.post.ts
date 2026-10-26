import { createError, defineEventHandler, readBody, setResponseStatus } from "nuxt/server";
import type { TelegramSessionResponse } from "../../../shared/types";
import { loginWithWidgetData } from "../../lib/legacy";
import { reportLoginError } from "../../lib/pipeline";
import { isCrossSiteRequest, isJsonRequest, noStore } from "../../lib/request";

export default defineEventHandler(async (event): Promise<TelegramSessionResponse> => {
  noStore(event);

  if (!isJsonRequest(event)) {
    setResponseStatus(event, 415);
    return { loggedIn: false };
  }
  if (isCrossSiteRequest(event)) {
    setResponseStatus(event, 403);
    return { loggedIn: false };
  }

  const session = await loginWithWidgetData(event, await readBody(event));
  if (session) return { loggedIn: true, ...session };

  await reportLoginError(event, "legacy", createError({ status: 401, message: "The login data failed Telegram's signature or age check." }));
  setResponseStatus(event, 401);
  return { loggedIn: false };
});
