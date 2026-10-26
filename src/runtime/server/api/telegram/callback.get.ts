import { createError, defineEventHandler, getQuery, sendRedirect } from "nuxt/server";
import { safeRedirect } from "../../../shared/redirect";
import { loginWithWidgetData } from "../../lib/legacy";
import { reportLoginError } from "../../lib/pipeline";
import { noStore } from "../../lib/request";

const NUMERIC_FIELDS = new Set(["id", "auth_date"]);

/** Query values are strings, so numeric fields go back to the types the widget's callback mode sends. */
function fromQuery(query: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(query).map(([key, value]) => [key, NUMERIC_FIELDS.has(key) && typeof value === "string" && String(Number(value)) === value ? Number(value) : value]));
}

export default defineEventHandler(async (event) => {
  noStore(event);
  // The query holds the signed login; it must not leak to the next page through Referer.
  event.res.headers.set("referrer-policy", "no-referrer");

  const { redirect, ...query } = getQuery(event);
  const session = await loginWithWidgetData(event, fromQuery(query));
  if (!session) {
    const error = createError({ status: 401, message: "The login data failed Telegram's signature or age check." });
    await reportLoginError(event, "legacy", error);
    throw error;
  }

  return sendRedirect(event, safeRedirect(redirect), 302);
});
