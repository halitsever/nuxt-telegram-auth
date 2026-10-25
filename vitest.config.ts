import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { defineVitestProject } from "@nuxt/test-utils/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "e2e",
          include: ["test/*.test.ts"],
        },
      },
      {
        test: {
          name: "unit",
          include: ["test/unit/**/*.test.ts"],
        },
      },
      await defineVitestProject({
        test: {
          name: "nuxt",
          include: ["test/nuxt/**/*.test.ts"],
          environment: "nuxt",
          environmentOptions: {
            nuxt: {
              rootDir: fileURLToPath(new URL("./test/fixtures/basic", import.meta.url)),
            },
            // Keeps the tests offline: the real Telegram script is never fetched.
            happyDom: {
              settings: { disableJavaScriptFileLoading: true },
            },
          },
        },
      }),
    ],
  },
});
