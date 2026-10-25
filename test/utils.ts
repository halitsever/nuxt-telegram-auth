import * as crypto from "node:crypto";

export const TEST_TOKEN = "test_bot_token_12345";

type Overrides = Record<string, string | number | undefined>;

/** Signs login data the way Telegram does. An `undefined` override drops the field. */
export function signAuthData(overrides: Overrides = {}, token = TEST_TOKEN) {
  const defaults = { id: 123456789, first_name: "Test", username: "testuser", auth_date: Math.floor(Date.now() / 1000) };
  const fields = Object.fromEntries(Object.entries({ ...defaults, ...overrides }).filter(([, value]) => value !== undefined)) as Record<string, string | number>;

  const secret = crypto.createHash("sha256").update(token).digest();
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");

  return { ...fields, hash: crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex") };
}

export function createSessionCookie(overrides: Overrides = {}, token = TEST_TOKEN) {
  return Buffer.from(JSON.stringify(signAuthData(overrides, token))).toString("base64");
}
