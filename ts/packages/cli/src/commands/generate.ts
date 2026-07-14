import { Command } from "commander";
import pc from "picocolors";
import * as fs from "node:fs";
import * as path from "node:path";

export const generateCommand = new Command()
  .command("generate")
  .description("Generate types or llms.txt")
  .argument("<type>", "Type to generate: types, llms")
  .option("-o, --output <path>", "Output file path")
  .action((type: string, options: { output?: string }) => {
    switch (type) {
      case "types":
        generateTypes(options.output);
        break;
      case "llms":
        generateLlmsTxt(options.output);
        break;
      default:
        console.log(pc.red(`Unknown generate type: ${type}`));
        console.log(pc.dim("Available types: types, llms"));
        process.exit(1);
    }
  });

interface PackageJson {
  name?: string;
  description?: string;
}

function generateTypes(outputPath?: string): void {
  const extensionsDir = findExtensionsDir();

  if (!extensionsDir) {
    console.log(pc.red("Could not find extensions directory."));
    process.exit(1);
  }

  console.log(pc.cyan("Generating TypeScript types from extensions..."));

  // Find all extension files
  const extensionFiles = fs.readdirSync(extensionsDir).filter((f) => f.endsWith(".extension.ts"));

  if (extensionFiles.length === 0) {
    console.log(pc.yellow("No extension files found."));
    return;
  }

  // Generate type definitions
  const typeDefinitions: string[] = [
    "// Auto-generated types from Channel.io App extensions",
    "// Do not edit manually",
    "",
    'import type { z } from "zod";',
    "",
  ];

  for (const file of extensionFiles) {
    const extensionName = file.replace(".extension.ts", "");
    typeDefinitions.push(`// Types for ${extensionName} extension`);
    typeDefinitions.push(`// See ${file} for implementation`);
    typeDefinitions.push("");
  }

  const output = outputPath ?? path.join(process.cwd(), "src/types/generated.d.ts");
  const outputDir = path.dirname(output);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(output, typeDefinitions.join("\n"));
  console.log(pc.green(`Generated types at ${output}`));
}

function generateLlmsTxt(outputPath?: string): void {
  console.log(pc.cyan("Generating llms.txt for AI assistants..."));

  const extensionsDir = findExtensionsDir();
  const cwd = process.cwd();

  // Read package.json for app info
  const packageJsonPath = path.join(cwd, "package.json");
  let appName = "Channel.io App";
  let appDescription = "";

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as PackageJson;
    appName = packageJson.name ?? appName;
    appDescription = packageJson.description ?? "";
  }

  const lines: string[] = [
    `# ${appName}`,
    "",
    appDescription ? `${appDescription}\n` : "",
    "## Overview",
    "",
    "This is a Channel.io app built with the Channel.io App SDK.",
    "",
    "## Project Structure",
    "",
  ];

  // Add project structure
  const structure = getProjectStructure(cwd);
  lines.push("```");
  lines.push(...structure);
  lines.push("```");
  lines.push("");

  // Add extensions documentation
  if (extensionsDir && fs.existsSync(extensionsDir)) {
    lines.push("## Extensions");
    lines.push("");

    const extensionFiles = fs.readdirSync(extensionsDir).filter((f) => f.endsWith(".extension.ts"));

    for (const file of extensionFiles) {
      const extensionName = file.replace(".extension.ts", "");
      lines.push(`### ${extensionName}`);
      lines.push("");

      // Read extension file and extract function names
      const content = fs.readFileSync(path.join(extensionsDir, file), "utf-8");
      const functionMatches = content.matchAll(
        /defineFunction\s*\(\s*\{[^}]*description:\s*["']([^"']+)["']/g
      );

      for (const match of functionMatches) {
        const description = match[1];
        if (description) {
          lines.push(`- ${description}`);
        }
      }

      lines.push("");
    }
  }

  // Add development commands
  lines.push("## Development");
  lines.push("");
  lines.push("```bash");
  lines.push("# Install dependencies");
  lines.push("pnpm install");
  lines.push("");
  lines.push("# Start development server");
  lines.push("pnpm dev  # or: channel-app dev");
  lines.push("");
  lines.push("# Build for production");
  lines.push("pnpm build  # or: channel-app build");
  lines.push("```");
  lines.push("");

  // Add SDK reference
  lines.push("## SDK Reference");
  lines.push("");
  lines.push("This app uses the following Channel.io App SDK packages:");
  lines.push("");
  lines.push("- `@channel.io/app-sdk-core` - Core types and extension builders");
  lines.push("- `@channel.io/app-sdk-server` - NestJS server integration");
  lines.push("- `@channel.io/app-sdk-wam` - React hooks for WAM (Web App Module)");
  lines.push("");

  const output = outputPath ?? path.join(cwd, "llms.txt");
  fs.writeFileSync(output, lines.join("\n"));

  console.log(pc.green(`Generated llms.txt at ${output}`));
}

function findExtensionsDir(): string | null {
  const possiblePaths = [
    "src/extensions",
    "apps/server/src/extensions",
    "server/src/extensions",
    "extensions",
  ];

  for (const p of possiblePaths) {
    const fullPath = path.join(process.cwd(), p);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

function getProjectStructure(cwd: string, _prefix = "", maxDepth = 3): string[] {
  const lines: string[] = [];
  const ignoreDirs = ["node_modules", ".git", "dist", ".turbo", ".next", "coverage"];

  function walk(dir: string, currentPrefix: string, depth: number): void {
    if (depth > maxDepth) return;

    const items = fs
      .readdirSync(dir)
      .filter((item) => !ignoreDirs.includes(item) && !item.startsWith("."));

    items.sort((a, b) => {
      const aIsDir = fs.statSync(path.join(dir, a)).isDirectory();
      const bIsDir = fs.statSync(path.join(dir, b)).isDirectory();
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      const itemPath = path.join(dir, item);
      const isLast = i === items.length - 1;
      const stat = fs.statSync(itemPath);

      const connector = isLast ? "└── " : "├── ";
      lines.push(`${currentPrefix}${connector}${item}${stat.isDirectory() ? "/" : ""}`);

      if (stat.isDirectory()) {
        const newPrefix = currentPrefix + (isLast ? "    " : "│   ");
        walk(itemPath, newPrefix, depth + 1);
      }
    }
  }

  lines.push(path.basename(cwd) + "/");
  walk(cwd, "", 1);

  return lines;
}
