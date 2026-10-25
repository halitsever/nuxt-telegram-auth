import type { Ref } from "vue";

export interface ITelegramSession {
  loggedIn: boolean;
  status: number;
  id?: number;
  message?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number;
  hash?: string;
}

export interface ITelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface IUserSession {
  session: Ref<ITelegramSession>;
  loading: Readonly<Ref<boolean>>;
  error: Readonly<Ref<string | null>>;
  clearSession: () => Promise<void>;
  refresh: () => Promise<void>;
}
