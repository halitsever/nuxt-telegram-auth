import { clearSession, createError, deriveSecret, getCookie, useSession } from "nuxt/server";
import type { RequestEvent } from "nuxt/server";
import type { TelegramSession } from "../../shared/types";
import { useTelegramConfig, type TelegramAuthConfig } from "./config";

const SECRET_HELP = "Set NUXT_APP_SECRET (at least 32 characters, e.g. `openssl rand -base64 32`) or NUXT_TELEGRAM_AUTH_SESSION_PASSWORD.";
const MIN_PASSWORD_LENGTH = 32;
const LARGE_COOKIE_BYTES = 3072;

type SealedPayload<T> = {
  kind?: string;
  value?: T;
};

export async function resolveSessionPassword(config: TelegramAuthConfig): Promise<string> {
  if (config.sessionPassword.length >= MIN_PASSWORD_LENGTH) return config.sessionPassword;
  if (!config.sessionPassword) {
    try {
      return await deriveSecret("nuxt-telegram-auth:session");
    } catch {
      // Nuxt's own message doesn't mention the session password option.
    }
  }
  throw createError({ status: 500, message: SECRET_HELP });
}

/** A value sealed into its own cookie. `kind` ties it to the cookie name, so a value sealed for one cookie is useless in another. */
export function openSealedCookie<T>(event: RequestEvent, options: { name: string; maxAge: number; cookie?: Record<string, unknown> }) {
  const config = useTelegramConfig();
  const sessionConfig = async () => ({
    name: options.name,
    password: await resolveSessionPassword(config),
    maxAge: options.maxAge,
    cookie: { ...config.session.cookie, ...options.cookie, path: "/" },
  });

  return {
    async read(): Promise<T | null> {
      // useSession seals an empty session (and sets a cookie) when there is none, so skip it for cookieless requests.
      if (!getCookie(event, options.name)) return null;
      const session = await useSession<SealedPayload<T>>(event, await sessionConfig());
      if (session.data.kind === options.name && session.data.value !== undefined) return session.data.value;
      await session.clear();
      return null;
    },
    async write(value: T): Promise<void> {
      // useSession treats a zero maxAge as "no expiry".
      if (!(options.maxAge > 0)) throw createError({ status: 500, message: `The ${options.name} cookie needs a lifetime above zero.` });
      const session = await useSession<SealedPayload<T>>(event, await sessionConfig());
      await session.update({ kind: options.name, value });
    },
    async clear(): Promise<void> {
      await clearSession(event, await sessionConfig());
    },
  };
}

export function readTelegramSession(event: RequestEvent): Promise<TelegramSession | null> {
  const { session } = useTelegramConfig();
  return openSealedCookie<TelegramSession>(event, { name: session.name, maxAge: session.maxAge }).read();
}

/** The session lasts `session.maxAge` from `loggedInAt`, however often it is rewritten. */
export async function writeTelegramSession(event: RequestEvent, value: TelegramSession): Promise<void> {
  const { session } = useTelegramConfig();
  const maxAge = value.loggedInAt + session.maxAge - Math.floor(Date.now() / 1000);
  await openSealedCookie<TelegramSession>(event, { name: session.name, maxAge }).write(value);

  if (import.meta.dev) {
    const cookie = event.res.headers.getSetCookie().find((header) => header.startsWith(`${session.name}=`));
    if (cookie && cookie.length > LARGE_COOKIE_BYTES) {
      console.warn(`[nuxt-telegram-auth] The session cookie is ${cookie.length} bytes. Browsers drop cookies over 4096 bytes, so keep less in session.data.`);
    }
  }
}

export function deleteTelegramSession(event: RequestEvent): Promise<void> {
  const { session } = useTelegramConfig();
  return openSealedCookie<TelegramSession>(event, { name: session.name, maxAge: session.maxAge }).clear();
}
