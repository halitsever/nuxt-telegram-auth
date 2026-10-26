import { vi } from "vitest";
import { useRuntimeConfig } from "#app";
import type { TelegramSdkOptions, TelegramSdkResult } from "../../src/runtime/app/utils/sdk";

/** Stands in for telegram-login.js: records init and open, and lets a test deliver the result. */
export interface FakeSdk {
  inits: TelegramSdkOptions[];
  opens: number;
  callback?: (result: TelegramSdkResult) => void;
  openImpl?: () => void;
  init(options: TelegramSdkOptions, callback: (result: TelegramSdkResult) => void): void;
  open(): void;
  auth: ReturnType<typeof vi.fn>;
}

export type TelegramWindow = { Telegram?: { Login?: unknown } };

export function installFakeSdk(): FakeSdk {
  const fake: FakeSdk = {
    inits: [],
    opens: 0,
    init(options, callback) {
      fake.inits.push(options);
      fake.callback = callback;
    },
    open() {
      fake.opens++;
      fake.openImpl?.();
    },
    auth: vi.fn(),
  };
  (window as TelegramWindow).Telegram = { Login: fake };
  return fake;
}

export const telegramConfig = () => useRuntimeConfig().public.telegramAuth as { clientId: string };
