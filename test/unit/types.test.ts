import { describe, expectTypeOf, it } from "vitest";
import type { ITelegramSession, IUserSession } from "../../src/module";

describe("module entry types", () => {
  it("exports the session types", () => {
    expectTypeOf<ITelegramSession["auth_date"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<IUserSession["refresh"]>().toEqualTypeOf<() => Promise<void>>();
  });
});
