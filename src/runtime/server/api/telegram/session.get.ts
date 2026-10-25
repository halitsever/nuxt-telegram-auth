import { eventHandler, setResponseHeader } from "h3";
import { getTelegramSession } from "../../../server/utils/telegram";

export default eventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "private, no-store");
  try {
    const session = await getTelegramSession(event);
    if (!session) return { loggedIn: false, status: 401, message: "Unauthorized" };
    const { hash: _hash, ...publicSession } = session;
    return publicSession;
  } catch (err) {
    console.error("Telegram Auth - ", err);
    return { loggedIn: false, status: 500, body: "Internal Server Error" };
  }
});
