import type { TelegramLoginErrorCode } from "../../shared/types";

/** A login failure with a code the client can act on. */
export class TelegramAuthError extends Error {
  readonly code: TelegramLoginErrorCode;
  readonly status: number;

  constructor(code: TelegramLoginErrorCode, status: number, message: string = code) {
    super(message);
    this.name = "TelegramAuthError";
    this.code = code;
    this.status = status;
  }
}
