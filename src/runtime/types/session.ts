import { type Ref } from "vue";

export interface ITelegramSession {
  loggedIn: boolean;
  status: number;
  id?: number;
  message?: string;
  first_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: Date;
  hash?: string;
}

export interface IUserSession {
  session: ITelegramSession | Ref<null>;
  clearSession: () => Promise<void>;
}
