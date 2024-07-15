import { eventHandler, deleteCookie } from "h3";

export default eventHandler(async (event) => {
  try {
    deleteCookie(event, "tg_user");
    return { status: 200, message: "Session Deleted" };
  } catch (err) {
    console.error("Telegram Auth - ", err);
    return { status: 500, message: "Interval Server Error" };
  }
});
