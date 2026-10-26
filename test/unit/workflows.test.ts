import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workflows = fileURLToPath(new URL("../../.github/workflows", import.meta.url));

/** The `run:` scripts of a workflow, with the line each starts on. Handles `run: |` blocks and one-line runs. */
function runScripts(yaml: string): { line: number; script: string }[] {
  const lines = yaml.split("\n");
  const scripts: { line: number; script: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const match = /^(\s*)(- )?run: (.*)$/.exec(lines[i]!);
    if (!match) continue;
    const keyIndent = match[1]!.length + (match[2] ? 2 : 0);
    if (match[3] !== "|") {
      scripts.push({ line: i + 1, script: match[3]! });
      continue;
    }
    const body: string[] = [];
    let j = i + 1;
    for (; j < lines.length; j++) {
      const line = lines[j]!;
      if (line.trim() !== "" && line.length - line.trimStart().length <= keyIndent) break;
      body.push(line);
    }
    const indent = Math.min(...body.filter((line) => line.trim() !== "").map((line) => line.length - line.trimStart().length));
    scripts.push({ line: i + 1, script: body.map((line) => line.slice(indent)).join("\n") });
    i = j - 1;
  }
  return scripts;
}

describe("workflow scripts", () => {
  // actionlint only checks shell syntax when shellcheck is installed, so check it here.
  it("parse as bash", () => {
    const failures = readdirSync(workflows)
      .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
      .flatMap((file) =>
        runScripts(readFileSync(join(workflows, file), "utf8")).flatMap(({ line, script }) => {
          const result = spawnSync("bash", ["-n"], { input: script, encoding: "utf8" });
          return result.status === 0 ? [] : [`${file}:${line}: ${result.stderr.trim()}`];
        }),
      );
    expect(failures).toEqual([]);
  });
});
