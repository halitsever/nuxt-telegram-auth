import { safeRedirect } from "../../shared/redirect";

interface RouteLike {
  path: string;
  fullPath: string;
  query: Record<string, unknown>;
}

/** Where to go after a login, or null to stay on the page. */
export function resolvePostLoginTarget(
  route: RouteLike,
  options: { mode: "popup" | "redirect"; redirectTo?: string },
  config: { loginPath: string; redirectAfterLogin: string },
): string | null {
  if (options.redirectTo) return safeRedirect(options.redirectTo, config.redirectAfterLogin);
  // The login page doesn't have to read ?redirect= itself.
  if (route.path === config.loginPath) return safeRedirect(route.query.redirect, config.redirectAfterLogin);
  // A popup login leaves the page as it is; a redirect login has to come back to it.
  return options.mode === "redirect" ? route.fullPath : null;
}
