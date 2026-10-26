export type TelegramAuthData = Record<string, string | number>;

const encoder = new TextEncoder();

function hexToBytes(hex: string) {
  if (!/^[0-9a-f]{64}$/i.test(hex)) return null;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export async function verifyTelegramAuthData(data: TelegramAuthData, botToken: string): Promise<boolean> {
  const { hash, ...fields } = data;
  if (typeof hash !== "string" || !Number.isFinite(Number(fields.auth_date))) return false;

  const signature = hexToBytes(hash);
  if (!signature) return false;

  const checkString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");

  const secret = await crypto.subtle.digest("SHA-256", encoder.encode(botToken));
  const key = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", key, signature, encoder.encode(checkString));
}

export function decodeAuthCookie(value: string): TelegramAuthData | null {
  try {
    const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0))));
    return data && typeof data === "object" && !Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

export { safeRedirect } from "../../shared/redirect";
