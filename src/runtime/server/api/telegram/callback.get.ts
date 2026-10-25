import { createError, eventHandler, getQuery, sendRedirect, setResponseHeader } from "h3";
import { createTelegramSession } from "../../lib/session";
import { safeRedirect } from "../../lib/verify";

const NUMERIC_FIELDS = new Set(["id", "auth_date"]);

/** Query values are strings, so numeric fields go back to the types the widget's callback mode sends. */
function fromQuery(query: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(query).map(([key, value]) => [key, NUMERIC_FIELDS.has(key) && typeof value === "string" && String(Number(value)) === value ? Number(value) : value]));
}

export default eventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  setResponseHeader(event, "Referrer-Policy", "no-referrer");

  const { redirect, ...query } = getQuery(event);
  const session = await createTelegramSession(event, fromQuery(query));
  if (!session) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

  return sendRedirect(event, safeRedirect(redirect), 302);
});
