import * as crypto from "node:crypto";

export const TEST_TOKEN = "test_bot_token_12345";

export function createSessionCookie(overrides: Record<string, string | number> = {}, token = TEST_TOKEN) {
  const userData: Record<string, string | number> = {
    id: 123456789,
    first_name: "Test",
    username: "testuser",
    auth_date: Math.floor(Date.now() / 1000),
    ...overrides,
  };

  const secret = crypto.createHash("sha256").update(token).digest();
  const dataCheckString = Object.keys(userData)
    .sort()
    .map((key) => `${key}=${userData[key]}`)
    .join("\n");

  const hash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  return Buffer.from(JSON.stringify({ ...userData, hash })).toString("base64");
}
