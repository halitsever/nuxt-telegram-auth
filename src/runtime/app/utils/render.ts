import { useRequestEvent } from "nuxt/app";

/** True for server renders whose HTML goes to more than one visitor: prerendering, and routes Nitro caches (which also strips the cookies). */
export function isSharedRender(): boolean {
  if (import.meta.prerender) return true;
  return !!(useRequestEvent()?.context as { cache?: unknown } | undefined)?.cache;
}
