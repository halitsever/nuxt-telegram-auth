import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { exportJWK, generateKeyPair, SignJWT, type JWK } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveTelegramConfig } from "../../src/runtime/server/lib/config";
import { verifyIdToken } from "../../src/runtime/server/lib/jwt";

const ISSUER = "https://oauth.telegram.org";
const CLIENT_ID = "123456789";
const CLAIMS = { sub: "1111111111111111111", id: "987654321", name: "Ada Lovelace", nonce: "n1" };

interface Key {
  privateKey: CryptoKey;
  jwk: JWK;
}

async function makeKey(alg: "RS256" | "ES256", kid: string): Promise<Key> {
  const { privateKey, publicKey } = await generateKeyPair(alg, { extractable: true });
  return { privateKey, jwk: { ...(await exportJWK(publicKey)), kid, alg } };
}

const now = () => Math.floor(Date.now() / 1000);

function sign(key: Key, overrides: Record<string, unknown> = {}) {
  const iat = now();
  return new SignJWT({ iss: ISSUER, aud: CLIENT_ID, iat, exp: iat + 30, ...CLAIMS, ...overrides }).setProtectedHeader({ alg: key.jwk.alg!, kid: key.jwk.kid }).sign(key.privateKey);
}

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
const unsigned = (header: object) => `${base64url(header)}.${base64url({ iss: ISSUER, aud: CLIENT_ID, ...CLAIMS })}.c2ln`;

const rsa = await makeKey("RS256", "rsa-1");
const ec = await makeKey("ES256", "ec-1");
const config = resolveTelegramConfig({ telegramAuth: { oidc: { jwks: JSON.stringify({ keys: [rsa.jwk, ec.jwk] }) } }, public: { telegramAuth: { clientId: CLIENT_ID } } });
const verify = (token: string, nonce = "n1") => verifyIdToken(token, { config, nonce });

describe("verifyIdToken", () => {
  it.each([
    ["RS256", rsa],
    ["ES256", ec],
  ])("accepts a %s token for the client id", async (_, key) => {
    expect((await verify(await sign(key))).id).toBe("987654321");
  });

  it("rejects a wrong audience", async () => {
    await expect(verify(await sign(rsa, { aud: "999" }))).rejects.toMatchObject({ code: "verification_failed" });
  });

  it("rejects a wrong issuer", async () => {
    await expect(verify(await sign(rsa, { iss: "https://evil.example" }))).rejects.toMatchObject({ code: "verification_failed" });
  });

  it("rejects alg none", async () => {
    await expect(verify(unsigned({ alg: "none" }))).rejects.toMatchObject({ code: "verification_failed" });
  });

  it.each(["EdDSA", "ES256K"])("rejects %s with unsupported_algorithm before verifying", async (alg) => {
    await expect(verify(unsigned({ alg, kid: "oidc-1" }))).rejects.toMatchObject({ code: "unsupported_algorithm", message: expect.stringContaining("Switch the bot to RS256 or ES256") });
  });

  it("rejects a nonce mismatch", async () => {
    await expect(verify(await sign(rsa), "other")).rejects.toMatchObject({ code: "verification_failed" });
  });

  it("accepts a token that expired 20 seconds ago", async () => {
    expect((await verify(await sign(rsa, { iat: now() - 50, exp: now() - 20 }))).id).toBe("987654321");
  });

  it("rejects a token that expired 40 seconds ago", async () => {
    await expect(verify(await sign(rsa, { iat: now() - 70, exp: now() - 40 }))).rejects.toMatchObject({ code: "verification_failed" });
  });

  it("accepts an iat 20 seconds in the future", async () => {
    expect((await verify(await sign(rsa, { iat: now() + 20, exp: now() + 50 }))).id).toBe("987654321");
  });
});

describe("verifyIdToken with a remote key set", () => {
  let server: Server | undefined;

  afterEach(() => {
    vi.useRealTimers();
    server?.close();
  });

  async function serveKeys(keys: () => JWK[]) {
    const state = { requests: 0 };
    server = createServer((_, res) => {
      state.requests++;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ keys: keys() }));
    });
    await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    const remote = resolveTelegramConfig({ telegramAuth: { oidc: { jwksUri: `http://127.0.0.1:${port}/jwks` } }, public: { telegramAuth: { clientId: CLIENT_ID } } });
    return { state, remote };
  }

  it("fetches the key set once for repeated checks", async () => {
    const { state, remote } = await serveKeys(() => [rsa.jwk]);
    await verifyIdToken(await sign(rsa), { config: remote });
    await verifyIdToken(await sign(rsa), { config: remote });
    expect(state.requests).toBe(1);
  });

  it("fetches the key set again for an unknown kid", async () => {
    const rotated = await makeKey("RS256", "rsa-2");
    let keys = [rsa.jwk];
    const { state, remote } = await serveKeys(() => keys);
    await verifyIdToken(await sign(rsa), { config: remote });

    keys = [rotated.jwk];
    // jose waits 30 seconds after a fetch before it fetches again.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 31_000);
    expect((await verifyIdToken(await sign(rotated), { config: remote })).id).toBe("987654321");
    expect(state.requests).toBe(2);
  });
});
