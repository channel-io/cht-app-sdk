import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readPackageJson(packageDir: string) {
  const pkgPath = resolve(__dirname, "..", "..", "..", packageDir, "package.json");
  return JSON.parse(readFileSync(pkgPath, "utf-8"));
}

describe("CJS export compatibility", () => {
  const packages = ["core", "server", "wam", "cli"];

  for (const pkg of packages) {
    describe(`packages/${pkg}`, () => {
      it('should have "default" condition in all export entries', () => {
        const pkgJson = readPackageJson(pkg);
        const exports = pkgJson.exports;

        expect(exports).toBeDefined();

        for (const [entryPoint, conditions] of Object.entries(exports)) {
          const conds = conditions as Record<string, string>;
          expect(conds.default, `Missing "default" in exports["${entryPoint}"]`).toBeDefined();
          expect(conds.default).toMatch(/\.js$/);
        }
      });

      it('"default" should point to the same file as "import"', () => {
        const pkgJson = readPackageJson(pkg);
        const exports = pkgJson.exports;

        for (const [entryPoint, conditions] of Object.entries(exports)) {
          const conds = conditions as Record<string, string>;
          expect(conds.default, `exports["${entryPoint}"].default should equal import`).toBe(
            conds.import
          );
        }
      });
    });
  }

  describe("packages/server", () => {
    it('should have "default" condition for ./nestjs subpath export', () => {
      const pkgJson = readPackageJson("server");
      const nestjsExport = pkgJson.exports["./nestjs"];

      expect(nestjsExport).toBeDefined();
      expect(nestjsExport.default).toBeDefined();
      expect(nestjsExport.default).toBe(nestjsExport.import);
    });
  });
});
