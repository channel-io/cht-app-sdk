import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const providerPath = "providers/WamThemeProvider.tsx";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "__tests__" ? [] : sourceFiles(path);
    }
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe("Bezier imports", () => {
  it("uses the redesigned beta subpath for UI components", () => {
    const rootImports = sourceFiles(sourceDirectory)
      .filter((path) => readFileSync(path, "utf8").includes('from "@channel.io/bezier-react"'))
      .map((path) => relative(sourceDirectory, path))
      .sort();

    expect(rootImports).toEqual([providerPath]);
    expect(readFileSync(join(sourceDirectory, providerPath), "utf8")).toContain(
      'import { AppProvider, type ThemeName } from "@channel.io/bezier-react"'
    );
  });
});
