import { describe, expectTypeOf, it } from "vitest";
import type { TelegramSession, TelegramSessionResponse, TelegramUser } from "../../src/module";

describe("module entry types", () => {
  it("exports the session types", () => {
    expectTypeOf<TelegramUser["id"]>().toEqualTypeOf<number>();
    expectTypeOf<TelegramSession["user"]>().toEqualTypeOf<TelegramUser>();
    expectTypeOf<Extract<TelegramSessionResponse, { loggedIn: true }>["user"]>().toEqualTypeOf<TelegramUser>();
  });
});
