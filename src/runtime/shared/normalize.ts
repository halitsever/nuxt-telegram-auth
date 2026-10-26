import type { TelegramUser } from "./types";

const DIGITS = /^\d+$/;

function text(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

function numericId(value: unknown): number | null {
  const id = typeof value === "number" ? String(value) : value;
  return typeof id === "string" && DIGITS.test(id) ? Number(id) : null;
}

/** Drops empty fields so the sealed cookie and the API responses stay small. */
function compact(user: TelegramUser): TelegramUser {
  return Object.fromEntries(Object.entries(user).filter(([, value]) => value !== undefined)) as TelegramUser;
}

/** Telegram sends the numeric user id only in the `id` claim; `sub` is opaque. */
export function userFromOidcClaims(claims: Record<string, unknown>): TelegramUser | null {
  const id = numericId(claims.id);
  if (id === null) return null;
  return compact({
    id,
    first_name: text(claims.given_name),
    last_name: text(claims.family_name),
    name: text(claims.name),
    username: text(claims.preferred_username),
    photo_url: text(claims.picture),
    phone_number: text(claims.phone_number),
  });
}

/** The widget posts numbers but its redirect sends strings, so both are accepted. */
export function userFromWidgetData(data: Record<string, string | number>): TelegramUser | null {
  const id = numericId(data.id);
  if (id === null) return null;
  return compact({
    id,
    first_name: text(data.first_name),
    last_name: text(data.last_name),
    username: text(data.username),
    photo_url: text(data.photo_url),
  });
}
