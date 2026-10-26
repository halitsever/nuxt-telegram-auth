import { defineEventHandler } from "nuxt/server";
import { hookCalls } from "../../hook-calls";

export default defineEventHandler(() => hookCalls.splice(0));
