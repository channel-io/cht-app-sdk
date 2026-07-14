import { Command } from "commander";
import pc from "picocolors";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

interface BuildOptions {
  output?: string;
}

export const buildCommand = new Command()
  .command("build")
  .description("Build the app for production")
  .option("-o, --output <dir>", "Output directory", "dist")
  .action((options: BuildOptions) => {
    const projectType = detectProjectType();

    console.log(pc.cyan("Building for production..."));

    try {
      // Build server if it exists
      if (projectType.hasServer) {
        console.log(pc.dim("Building server..."));
        buildServer(projectType.serverPath, options.output);
        console.log(pc.green("Server built successfully"));
      }

      // Build WAM if it exists
      if (projectType.hasWam) {
        console.log(pc.dim("Building WAM..."));
        buildWam(projectType.wamPath, options.output);
        console.log(pc.green("WAM built successfully"));
      }

      if (!projectType.hasServer && !projectType.hasWam) {
        console.log(pc.yellow("No server or WAM found to build."));
        console.log(pc.dim("Make sure you're in a Channel.io app project directory."));
        return;
      }

      console.log(pc.green("\nBuild completed successfully!"));
    } catch (error) {
      console.log(
        pc.red(`Build failed: ${error instanceof Error ? error.message : String(error)}`)
      );
      process.exit(1);
    }
  });

interface ProjectType {
  hasServer: boolean;
  serverPath: string;
  hasWam: boolean;
  wamPath: string;
}

function detectProjectType(): ProjectType {
  const cwd = process.cwd();

  // Check for monorepo structure
  const appsServerPath = path.join(cwd, "apps/server");
  const appsWamPath = path.join(cwd, "apps/wam");

  if (fs.existsSync(appsServerPath) && fs.existsSync(appsWamPath)) {
    return {
      hasServer: true,
      serverPath: appsServerPath,
      hasWam: true,
      wamPath: appsWamPath,
    };
  }

  // Check for standalone server/wam directories
  const serverPath = path.join(cwd, "server");
  const wamPath = path.join(cwd, "wam");

  if (
    fs.existsSync(path.join(serverPath, "package.json")) &&
    fs.existsSync(path.join(wamPath, "package.json"))
  ) {
    return {
      hasServer: true,
      serverPath: serverPath,
      hasWam: true,
      wamPath: wamPath,
    };
  }

  // Check for single project
  const packageJsonPath = path.join(cwd, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    return {
      hasServer: !!deps["@nestjs/core"] || !!deps["@channel.io/app-sdk-server"],
      serverPath: cwd,
      hasWam: !!deps.react || !!deps["@channel.io/app-sdk-wam"],
      wamPath: cwd,
    };
  }

  return {
    hasServer: false,
    serverPath: cwd,
    hasWam: false,
    wamPath: cwd,
  };
}

function buildServer(serverPath: string, _outputDir?: string): void {
  const packageJsonPath = path.join(serverPath, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`No package.json found at ${serverPath}`);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const scripts = packageJson.scripts || {};

  // Try to find the best build script
  if (scripts.build) {
    execSync("pnpm run build", { cwd: serverPath, stdio: "inherit" });
  } else {
    // Default to tsc for TypeScript projects
    const tsconfigPath = path.join(serverPath, "tsconfig.json");
    if (fs.existsSync(tsconfigPath)) {
      execSync("pnpm tsc", { cwd: serverPath, stdio: "inherit" });
    } else {
      throw new Error("No build script found and no tsconfig.json for TypeScript compilation");
    }
  }
}

function buildWam(wamPath: string, _outputDir?: string): void {
  const packageJsonPath = path.join(wamPath, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`No package.json found at ${wamPath}`);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const scripts = packageJson.scripts || {};

  // Try to find the best build script
  if (scripts.build) {
    execSync("pnpm run build", { cwd: wamPath, stdio: "inherit" });
  } else {
    throw new Error("No build script found in WAM package.json");
  }
}
