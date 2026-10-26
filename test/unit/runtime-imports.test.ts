import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const runtime = fileURLToPath(new URL("../../src/runtime", import.meta.url));
const FORBIDDEN = /from ["'](?:h3|nitropack[^"']*|node:[^"']+)["']|\bBuffer\b/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith(".ts") ? [path] : [];
  });
}

describe("server runtime imports", () => {
  // Nuxt 5 swaps h3 and Nitro for new majors, and edge runtimes have no node: modules.
  it("keeps server runtime code on nuxt/server and jose", () => {
    const offenders = ["server", "shared"]
      .flatMap((dir) => sourceFiles(join(runtime, dir)))
      .flatMap((file) =>
        readFileSync(file, "utf8")
          .split("\n")
          .flatMap((line, index) => (FORBIDDEN.test(line) ? [`${relative(runtime, file)}:${index + 1}: ${line.trim()}`] : [])),
      );
    expect(offenders).toEqual([]);
  });
});
