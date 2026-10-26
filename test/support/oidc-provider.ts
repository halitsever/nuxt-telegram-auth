import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

export const CLIENT_ID = "123456789";

/** Claims shaped like the ones Telegram sent during the spike, with made-up values. */
export const DEFAULT_CLAIMS = {
  sub: "1111111111111111111",
  id: "987654321",
  name: "Ada Lovelace",
  given_name: "Ada",
  family_name: "Lovelace",
  preferred_username: "ada",
  picture: "https://t.me/i/userpic/320/ada.jpg",
};

export interface MockProvider {
  url: string;
  /** Put into the next token as `nonce`. */
  nextNonce: string | null;
  /** Merged into the next token, then reset. An `undefined` value drops the claim. */
  nextClaims: Record<string, unknown>;
  /** Makes the next token request fail with 400 and this error, then resets. */
  tokenError: string | null;
  tokenRequests: { authorization: string | null; body: URLSearchParams }[];
  signIdToken(claims?: Record<string, unknown>): Promise<string>;
  close(): Promise<void>;
}

/** A stand-in for oauth.telegram.org: a JWKS and a token endpoint on a random local port. */
export async function startMockProvider(): Promise<MockProvider> {
  const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true });
  const jwk = { ...(await exportJWK(publicKey)), kid: "oidc-1", alg: "RS256", use: "sig" };

  const provider: MockProvider = {
    url: "",
    nextNonce: null,
    nextClaims: {},
    tokenError: null,
    tokenRequests: [],
    async signIdToken(claims = {}) {
      const iat = Math.floor(Date.now() / 1000);
      const payload = { iss: provider.url, aud: CLIENT_ID, iat, exp: iat + 30, ...DEFAULT_CLAIMS, ...(provider.nextNonce ? { nonce: provider.nextNonce } : {}), ...claims };
      return new SignJWT(payload).setProtectedHeader({ alg: "RS256", kid: "oidc-1" }).sign(privateKey);
    },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };

  const server = createServer(async (req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.method === "GET" && req.url === "/.well-known/jwks.json") {
      res.end(JSON.stringify({ keys: [jwk] }));
      return;
    }
    if (req.method === "POST" && req.url === "/token") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      provider.tokenRequests.push({ authorization: req.headers.authorization ?? null, body: new URLSearchParams(Buffer.concat(chunks).toString()) });

      if (provider.tokenError) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: provider.tokenError }));
        provider.tokenError = null;
        return;
      }
      const idToken = await provider.signIdToken(provider.nextClaims);
      provider.nextClaims = {};
      res.end(JSON.stringify({ access_token: "access", token_type: "Bearer", expires_in: 3600, scope: "openid profile", id_token: idToken }));
      return;
    }
    res.statusCode = 404;
    res.end("{}");
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  provider.url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return provider;
}

/** The env that points the oidc fixture at the mock. Nitro parses the client id into a number, as in production. */
export function mockProviderEnv(provider: MockProvider): Record<string, string> {
  return {
    NUXT_PUBLIC_TELEGRAM_AUTH_CLIENT_ID: CLIENT_ID,
    NUXT_TELEGRAM_AUTH_OIDC_ISSUER: provider.url,
    NUXT_TELEGRAM_AUTH_OIDC_AUTHORIZATION_ENDPOINT: `${provider.url}/auth`,
    NUXT_TELEGRAM_AUTH_OIDC_TOKEN_ENDPOINT: `${provider.url}/token`,
    NUXT_TELEGRAM_AUTH_OIDC_JWKS_URI: `${provider.url}/.well-known/jwks.json`,
  };
}
