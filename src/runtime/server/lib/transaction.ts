import type { RequestEvent } from "nuxt/server";
import { randomToken } from "./pkce";
import { openSealedCookie } from "./store";

const TRANSACTION_COOKIE = "nuxt-telegram-auth-oidc";
const TRANSACTION_MAX_AGE = 10 * 60;
const NONCE_COOKIE = "nuxt-telegram-auth-nonce";
const NONCE_MAX_AGE = 5 * 60;

/** What the redirect login needs to finish on the callback. Lives in a SameSite=Lax cookie, so Telegram's redirect back carries it. */
export interface OidcTransaction {
  state: string;
  verifier: string;
  nonce: string;
  redirect: string;
}

const transactionCookie = (event: RequestEvent) => openSealedCookie<OidcTransaction>(event, { name: TRANSACTION_COOKIE, maxAge: TRANSACTION_MAX_AGE });
const nonceCookie = (event: RequestEvent) => openSealedCookie<string>(event, { name: NONCE_COOKIE, maxAge: NONCE_MAX_AGE });

export async function startOidcTransaction(event: RequestEvent, redirect: string): Promise<OidcTransaction> {
  const transaction = { state: randomToken(), verifier: randomToken(), nonce: randomToken(), redirect };
  await transactionCookie(event).write(transaction);
  return transaction;
}

export function readOidcTransaction(event: RequestEvent): Promise<OidcTransaction | null> {
  return transactionCookie(event).read();
}

export function clearOidcTransaction(event: RequestEvent): Promise<void> {
  return transactionCookie(event).clear();
}

export async function issueNonce(event: RequestEvent): Promise<string> {
  const nonce = randomToken();
  await nonceCookie(event).write(nonce);
  return nonce;
}

/** Reads and clears the SDK nonce: each one serves a single login attempt. */
export async function takeNonce(event: RequestEvent): Promise<string | null> {
  const cookie = nonceCookie(event);
  const nonce = await cookie.read();
  if (nonce !== null) await cookie.clear();
  return nonce;
}
