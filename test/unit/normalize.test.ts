import { describe, expect, it } from "vitest";
import { userFromOidcClaims, userFromWidgetData } from "../../src/runtime/shared/normalize";

const claims = {
  iss: "https://oauth.telegram.org",
  aud: "123456789",
  sub: "1111111111111111111",
  id: "987654321",
  name: "Ada Lovelace",
  given_name: "Ada",
  family_name: "Lovelace",
  preferred_username: "ada",
  picture: "https://t.me/i/userpic/320/ada.jpg",
};

describe("userFromOidcClaims", () => {
  it("maps OIDC claims to a user with the numeric Telegram id", () => {
    expect(userFromOidcClaims(claims)).toEqual({ id: 987654321, first_name: "Ada", last_name: "Lovelace", name: "Ada Lovelace", username: "ada", photo_url: "https://t.me/i/userpic/320/ada.jpg" });
  });

  it("leaves last_name out when family_name is empty", () => {
    expect(userFromOidcClaims({ ...claims, family_name: "" })).not.toHaveProperty("last_name");
  });

  it("keeps phone_number when the phone scope was granted", () => {
    expect(userFromOidcClaims({ ...claims, phone_number: "+15550100" })?.phone_number).toBe("+15550100");
  });

  it.each([[undefined], ["abc"], [""], ["-5"]])("returns null when the id claim is %j", (id) => {
    expect(userFromOidcClaims({ ...claims, id })).toBeNull();
  });
});

describe("userFromWidgetData", () => {
  it("maps widget data and drops auth_date and hash", () => {
    expect(userFromWidgetData({ id: 42, first_name: "Ada", username: "ada", photo_url: "https://t.me/a.jpg", auth_date: 1700000000, hash: "f".repeat(64) })).toEqual({
      id: 42,
      first_name: "Ada",
      username: "ada",
      photo_url: "https://t.me/a.jpg",
    });
  });

  it("reads a string widget id from a query string", () => {
    expect(userFromWidgetData({ id: "42", auth_date: "1700000000", hash: "f" })?.id).toBe(42);
  });
});
