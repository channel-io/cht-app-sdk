import { Command } from "commander";
import pc from "picocolors";
import * as fs from "node:fs";
import * as path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";

interface DevOptions {
  port?: string;
  wamPort?: string;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export const devCommand = new Command()
  .command("dev")
  .description("Start development server")
  .option("-p, --port <port>", "Server port", "3000")
  .option("-w, --wam-port <port>", "WAM dev server port", "5173")
  .action((options: DevOptions) => {
    const projectType = detectProjectType();

    console.log(pc.cyan("Starting development servers..."));

    const processes: ChildProcess[] = [];

    // Start server if it exists
    if (projectType.hasServer) {
      console.log(pc.dim(`Starting server on port ${options.port}...`));
      const serverProcess = startServer(projectType.serverPath, options.port);
      if (serverProcess) {
        processes.push(serverProcess);
      }
    }

    // Start WAM dev server if it exists
    if (projectType.hasWam) {
      console.log(pc.dim(`Starting WAM dev server on port ${options.wamPort}...`));
      const wamProcess = startWamDevServer(projectType.wamPath, options.wamPort);
      if (wamProcess) {
        processes.push(wamProcess);
      }
    }

    if (processes.length === 0) {
      console.log(pc.yellow("No server or WAM found to start."));
      console.log(pc.dim("Make sure you're in a Channel.io app project directory."));
      return;
    }

    // Handle shutdown
    process.on("SIGINT", () => {
      console.log(pc.dim("\nShutting down..."));
      for (const p of processes) {
        p.kill();
      }
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      for (const p of processes) {
        p.kill();
      }
      process.exit(0);
    });
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

  // Check for standalone server
  const serverPackageJson = path.join(cwd, "server/package.json");
  const wamPackageJson = path.join(cwd, "wam/package.json");

  if (fs.existsSync(serverPackageJson) && fs.existsSync(wamPackageJson)) {
    return {
      hasServer: true,
      serverPath: path.join(cwd, "server"),
      hasWam: true,
      wamPath: path.join(cwd, "wam"),
    };
  }

  // Check for single project (server only or combined)
  const packageJsonPath = path.join(cwd, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as PackageJson;
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    return {
      hasServer: !!deps["@nestjs/core"] || !!deps["@channel.io/app-sdk-server"],
      serverPath: cwd,
      hasWam: !!deps["react"] || !!deps["@channel.io/app-sdk-wam"],
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

function startServer(serverPath: string, port?: string): ChildProcess | null {
  const packageJsonPath = path.join(serverPath, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    console.log(pc.yellow(`No package.json found at ${serverPath}`));
    return null;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as PackageJson;
  const scripts = packageJson.scripts ?? {};

  // Try to find the best dev script
  let command: string;
  let args: string[];

  if (scripts["dev"]) {
    command = "pnpm";
    args = ["run", "dev"];
  } else if (scripts["start:dev"]) {
    command = "pnpm";
    args = ["run", "start:dev"];
  } else if (scripts["start"]) {
    command = "pnpm";
    args = ["run", "start"];
  } else {
    console.log(pc.yellow("No dev/start script found in server package.json"));
    return null;
  }

  const env = { ...process.env };
  if (port) {
    env["PORT"] = port;
  }

  const child = spawn(command, args, {
    cwd: serverPath,
    stdio: "inherit",
    env,
    shell: true,
  });

  child.on("error", (err) => {
    console.log(pc.red(`Server error: ${err.message}`));
  });

  return child;
}

function startWamDevServer(wamPath: string, port?: string): ChildProcess | null {
  const packageJsonPath = path.join(wamPath, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    console.log(pc.yellow(`No package.json found at ${wamPath}`));
    return null;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as PackageJson;
  const scripts = packageJson.scripts ?? {};

  // Try to find the best dev script
  let command: string;
  let args: string[];

  if (scripts["dev"]) {
    command = "pnpm";
    args = ["run", "dev"];
  } else if (scripts["start"]) {
    command = "pnpm";
    args = ["run", "start"];
  } else {
    console.log(pc.yellow("No dev/start script found in WAM package.json"));
    return null;
  }

  const env = { ...process.env };
  if (port) {
    env["PORT"] = port;
    env["VITE_PORT"] = port;
  }

  const child = spawn(command, args, {
    cwd: wamPath,
    stdio: "inherit",
    env,
    shell: true,
  });

  child.on("error", (err) => {
    console.log(pc.red(`WAM dev server error: ${err.message}`));
  });

  return child;
}
