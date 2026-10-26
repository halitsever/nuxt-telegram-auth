import { createError, defineEventHandler, readBody, setResponseStatus } from "nuxt/server";
import type { TelegramSessionResponse } from "../../../shared/types";
import { loginWithWidgetData } from "../../lib/legacy";
import { reportLoginError } from "../../lib/pipeline";
import { noStore, refuseLoginPost } from "../../lib/request";

export default defineEventHandler(async (event): Promise<TelegramSessionResponse> => {
  noStore(event);

  const refused = refuseLoginPost(event);
  if (refused) {
    setResponseStatus(event, refused);
    return { loggedIn: false };
  }

  const session = await loginWithWidgetData(event, await readBody(event));
  if (session) return { loggedIn: true, ...session };

  await reportLoginError(event, "legacy", createError({ status: 401, message: "The login data failed Telegram's signature or age check." }));
  setResponseStatus(event, 401);
  return { loggedIn: false };
});
