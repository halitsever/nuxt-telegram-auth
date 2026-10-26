import { getRequestHeader, getRequestHost } from "nuxt/server";
import type { RequestEvent } from "nuxt/server";

/** Auth responses carry personal data, so no shared cache may keep them. */
export function noStore(event: RequestEvent): void {
  event.res.headers.set("cache-control", "private, no-store");
}

export function isJsonRequest(event: RequestEvent): boolean {
  return getRequestHeader(event, "content-type")?.startsWith("application/json") ?? false;
}

/** The status to refuse a login POST with, or null. A cross-site form can't send JSON without a CORS preflight. */
export function refuseLoginPost(event: RequestEvent): 415 | 403 | null {
  if (!isJsonRequest(event)) return 415;
  if (isCrossSiteRequest(event)) return 403;
  return null;
}

/** A login posted from another site could sign the visitor into the attacker's account. */
export function isCrossSiteRequest(event: RequestEvent): boolean {
  const fetchSite = getRequestHeader(event, "sec-fetch-site");
  if (fetchSite) return fetchSite !== "same-origin" && fetchSite !== "none";

  const origin = getRequestHeader(event, "origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== getRequestHost(event, { xForwardedHost: true });
  } catch {
    return true;
  }
}
