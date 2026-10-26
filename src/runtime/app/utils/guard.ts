interface GuardedRoute {
  path: string;
  fullPath: string;
  meta: { telegramAuth?: boolean | "guest" };
}

/** Where a page visit should go instead, or null to let it through. */
export function decideAuthRedirect(to: GuardedRoute, loggedIn: boolean, config: { loginPath: string; redirectAfterLogin: string; protectAll: boolean }): string | null {
  // With protectAll, pages without meta count as protected; the login page never does, or nobody could reach it.
  const rule = to.meta.telegramAuth ?? (config.protectAll && to.path !== config.loginPath ? true : undefined);
  if (rule === true && !loggedIn) return `${config.loginPath}?redirect=${encodeURIComponent(to.fullPath)}`;
  if (rule === "guest" && loggedIn) return config.redirectAfterLogin;
  return null;
}
