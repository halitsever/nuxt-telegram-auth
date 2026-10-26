/** `id` is Telegram's numeric user id, the same for every login method. */
export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  name?: string;
  photo_url?: string;
  phone_number?: string;
  language_code?: string;
  is_premium?: boolean;
}

export type TelegramProvider = "oidc" | "sdk" | "legacy" | "miniapp";

/** What the legacy widget passes to its callback: Telegram's signed login data. */
export interface TelegramWidgetUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface TelegramSession {
  user: TelegramUser;
  provider: TelegramProvider;
  /** Unix seconds. */
  loggedInAt: number;
  /** OIDC subject: opaque and different for every bot. */
  sub?: string;
  /** Whatever `telegram-auth:login` hooks stored. */
  data?: Record<string, unknown>;
}

export type TelegramSessionResponse = ({ loggedIn: true } & TelegramSession) | { loggedIn: false };

export type TelegramLoginErrorCode =
  | "popup_closed"
  | "popup_blocked"
  | "sdk_load_failed"
  | "verification_failed"
  | "unsupported_algorithm"
  | "not_configured"
  | "expired"
  | "denied"
  | "invalid_state"
  | "provider_error";
