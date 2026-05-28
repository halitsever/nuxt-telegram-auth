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
  auth_date?: Date;
  hash?: string;
}

export interface IUserSession {
  session: ITelegramSession | Ref<null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  clearSession: () => Promise<void>;
  refresh: () => Promise<void>;
}
