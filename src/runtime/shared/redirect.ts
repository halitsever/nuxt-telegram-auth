/** Keeps redirects on the current origin, so a crafted `redirect` can't send the user elsewhere. */
export function safeRedirect(target: unknown, fallback = "/"): string {
  if (typeof target !== "string" || !target.startsWith("/")) return fallback;
  try {
    const url = new URL(target, "http://localhost");
    return url.origin === "http://localhost" ? url.pathname + url.search + url.hash : fallback;
  } catch {
    return fallback;
  }
}
