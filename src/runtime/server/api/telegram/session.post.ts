import { eventHandler, getRequestHeader, readBody, setResponseHeader, setResponseStatus } from "h3";
import { createTelegramSession, isCrossSiteRequest } from "../../lib/session";

export default eventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "private, no-store");

  if (!getRequestHeader(event, "content-type")?.startsWith("application/json")) {
    setResponseStatus(event, 415);
    return { loggedIn: false, status: 415, message: "Unsupported Media Type" };
  }

  if (isCrossSiteRequest(event)) {
    setResponseStatus(event, 403);
    return { loggedIn: false, status: 403, message: "Forbidden" };
  }

  const session = await createTelegramSession(event, await readBody(event));
  if (session) return session;

  setResponseStatus(event, 401);
  return { loggedIn: false, status: 401, message: "Unauthorized" };
});
