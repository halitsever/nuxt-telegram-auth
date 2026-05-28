import { eventHandler } from "h3";
import { getTelegramSession } from "../../../server/utils/telegram";

export default eventHandler(async (event) => {
  try {
    const session = await getTelegramSession(event);
    if (!session) return { loggedIn: false, status: 401, message: "Unauthorized" };
    return session;
  } catch (err) {
    console.error("Telegram Auth - ", err);
    return { loggedIn: false, status: 500, body: "Internal Server Error" };
  }
});
