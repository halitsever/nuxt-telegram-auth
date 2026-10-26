import { createLocalJWKSet, createRemoteJWKSet, decodeProtectedHeader, jwtVerify, type JWTVerifyGetKey } from "jose";
import type { TelegramAuthConfig } from "./config";
import { TelegramAuthError } from "./errors";

/** Telegram drops the `profile` claims, and with them the user id, for bots that sign with these. */
const UNSUPPORTED_ALGORITHMS = new Set(["EdDSA", "ES256K"]);
const UNSUPPORTED_MESSAGE =
  "This bot signs Telegram Login tokens with EdDSA or ES256K. Those algorithms don't include the Telegram user id, so this module can't use them. Switch the bot to RS256 or ES256 in BotFather → Login Widget → Advanced.";

/** One key set per URL for the life of the server: jose caches the keys and refetches on an unknown `kid`. */
const remoteKeySets = new Map<string, JWTVerifyGetKey>();

function keySet(config: TelegramAuthConfig): JWTVerifyGetKey {
  if (config.oidc.jwks) return createLocalJWKSet(JSON.parse(config.oidc.jwks));
  let keys = remoteKeySets.get(config.oidc.jwksUri);
  if (!keys) {
    keys = createRemoteJWKSet(new URL(config.oidc.jwksUri));
    remoteKeySets.set(config.oidc.jwksUri, keys);
  }
  return keys;
}

/** Returns the token's claims once its signature, issuer, audience, lifetime and nonce check out. */
export async function verifyIdToken(idToken: string, options: { config: TelegramAuthConfig; nonce?: string }): Promise<Record<string, unknown>> {
  const { config, nonce } = options;

  let algorithm: unknown;
  try {
    algorithm = decodeProtectedHeader(idToken).alg;
  } catch {
    throw new TelegramAuthError("verification_failed", 401, "The id_token is not a JWT.");
  }
  if (typeof algorithm === "string" && UNSUPPORTED_ALGORITHMS.has(algorithm)) throw new TelegramAuthError("unsupported_algorithm", 401, UNSUPPORTED_MESSAGE);

  try {
    const { payload } = await jwtVerify(idToken, keySet(config), {
      issuer: config.oidc.issuer,
      audience: config.clientId,
      algorithms: ["RS256", "ES256"],
      // Telegram's tokens live 30 seconds; this covers a server clock that is off by as much.
      clockTolerance: 30,
    });
    if (nonce !== undefined && payload.nonce !== nonce) throw new Error("nonce mismatch");
    return payload;
  } catch (error) {
    throw new TelegramAuthError("verification_failed", 401, `The id_token failed verification: ${(error as Error).message}`);
  }
}
