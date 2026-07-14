import { Command } from "commander";
import pc from "picocolors";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const createCommand = new Command("create")
  .description("Create a new Channel.io app")
  .argument("<name>", "Name of the app")
  .option("-t, --template <template>", "Template to use", "basic")
  .action(async (name: string, options: { template: string }) => {
    console.log(pc.cyan(`\nCreating Channel.io app: ${pc.bold(name)}\n`));

    const targetDir = join(process.cwd(), name);

    try {
      // Create directory structure
      await mkdir(targetDir, { recursive: true });
      await mkdir(join(targetDir, "apps", "server", "src", "extensions"), { recursive: true });
      await mkdir(join(targetDir, "apps", "wam", "src"), { recursive: true });
      await mkdir(join(targetDir, "packages", "shared", "src"), { recursive: true });

      // Create root package.json
      await writeFile(
        join(targetDir, "package.json"),
        JSON.stringify(
          {
            name: name,
            version: "0.0.1",
            private: true,
            scripts: {
              dev: "turbo run dev",
              build: "turbo run build",
              lint: "turbo run lint",
            },
            devDependencies: {
              turbo: "^2.3.3",
              typescript: "^5.7.2",
            },
            packageManager: "pnpm@9.15.4",
          },
          null,
          2
        )
      );

      // Create pnpm-workspace.yaml
      await writeFile(
        join(targetDir, "pnpm-workspace.yaml"),
        `packages:
  - "apps/*"
  - "packages/*"
`
      );

      // Create turbo.json
      await writeFile(
        join(targetDir, "turbo.json"),
        JSON.stringify(
          {
            $schema: "https://turbo.build/schema.json",
            tasks: {
              build: {
                dependsOn: ["^build"],
                outputs: ["dist/**"],
              },
              dev: {
                cache: false,
                persistent: true,
              },
              lint: {
                outputs: [],
              },
            },
          },
          null,
          2
        )
      );

      // Create .env.example
      await writeFile(
        join(targetDir, ".env.example"),
        `APP_ID=your-app-id
APP_SECRET=your-app-secret
`
      );

      // Create server app
      await createServerApp(targetDir, name, options.template);

      // Create WAM app
      await createWamApp(targetDir, name);

      // Create shared package
      await createSharedPackage(targetDir, name);

      console.log(pc.green(`\n✓ Created ${name} successfully!\n`));
      console.log(`Next steps:\n`);
      console.log(`  cd ${name}`);
      console.log(`  pnpm install`);
      console.log(`  cp .env.example .env`);
      console.log(`  pnpm dev\n`);
    } catch (error) {
      console.error(pc.red(`\nError creating app: ${String(error)}`));
      process.exit(1);
    }
  });

async function createServerApp(targetDir: string, name: string, _template: string) {
  const serverDir = join(targetDir, "apps", "server");

  // package.json
  await writeFile(
    join(serverDir, "package.json"),
    JSON.stringify(
      {
        name: `@${name}/server`,
        version: "0.0.1",
        private: true,
        type: "module",
        scripts: {
          build: "nest build",
          dev: "nest start --watch",
          start: "node dist/main.js",
          lint: "eslint src/",
        },
        dependencies: {
          "@channel.io/app-sdk": "^0.0.1",
          "@nestjs/common": "^10.4.15",
          "@nestjs/core": "^10.4.15",
          "@nestjs/platform-express": "^10.4.15",
          "reflect-metadata": "^0.2.2",
          rxjs: "^7.8.1",
          zod: "^3.24.1",
        },
        devDependencies: {
          "@nestjs/cli": "^10.4.9",
          "@types/node": "^22.10.5",
          typescript: "^5.7.2",
        },
      },
      null,
      2
    )
  );

  // tsconfig.json
  await writeFile(
    join(serverDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          outDir: "./dist",
          rootDir: "./src",
        },
        include: ["src/**/*"],
      },
      null,
      2
    )
  );

  // nest-cli.json
  await writeFile(
    join(serverDir, "nest-cli.json"),
    JSON.stringify(
      {
        $schema: "https://json.schemastore.org/nest-cli",
        collection: "@nestjs/schematics",
        sourceRoot: "src",
        compilerOptions: {
          builder: "tsc",
        },
      },
      null,
      2
    )
  );

  // main.ts
  await writeFile(
    join(serverDir, "src", "main.ts"),
    `import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(\`Server running on http://localhost:\${port}\`);
}

bootstrap();
`
  );

  // app.module.ts
  await writeFile(
    join(serverDir, "src", "app.module.ts"),
    `import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ChannelAppModule } from "@channel.io/app-sdk";
import { commandExtension } from "./extensions/command.extension.js";

@Module({
  imports: [
    ConfigModule.forRoot(),
    ChannelAppModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        appId: config.get("APP_ID") ?? "",
        appSecret: config.get("APP_SECRET") ?? "",
        extensions: [commandExtension],
        debug: true,
      }),
    }),
  ],
})
export class AppModule {}
`
  );

  // Sample extension
  await writeFile(
    join(serverDir, "src", "extensions", "command.extension.ts"),
    `import {
  createExtension,
  defineFunction,
  GetCommandsOutputSchema,
  CommandResultSchema,
} from "@channel.io/app-sdk";
import { z } from "zod";

const CommandActionInput = z.object({
  chat: z.object({
    type: z.string(),
    id: z.string(),
  }),
  trigger: z.object({
    type: z.string(),
    attributes: z.record(z.string()),
  }),
  input: z.record(z.unknown()),
  language: z.string(),
});

export const commandExtension = createExtension({
  name: "command",
  systemVersion: "v1",
  groups: {
    metadata: {
      getCommands: defineFunction({
        description: "Return command definitions for AppStore registration",
        input: z.object({}),
        output: GetCommandsOutputSchema,
        handler: async () => ({
          commands: [
            {
              name: "hello",
              scope: "desk",
              actionFunctionName: "extension.command.command.execute",
              alfMode: "disable",
            },
          ],
        }),
      }),
    },
    command: {
      execute: defineFunction({
        description: "Execute the hello command",
        input: CommandActionInput,
        output: CommandResultSchema,
        handler: async (ctx, params) => {
          const target =
            typeof params.input.target === "string" && params.input.target.trim() !== ""
              ? params.input.target
              : "world";

          console.log(\`Executing command for \${target} in channel \${ctx.channel.id}\`);

          return {
            type: "text",
            attributes: {
              message: \`Hello, \${target}!\`,
            },
          };
        },
      }),
    },
  },
});
`
  );

  // Add @nestjs/config to dependencies
  const pkgJson = JSON.parse(
    await (await import("node:fs/promises")).readFile(join(serverDir, "package.json"), "utf-8")
  );
  pkgJson.dependencies["@nestjs/config"] = "^3.3.0";
  await writeFile(join(serverDir, "package.json"), JSON.stringify(pkgJson, null, 2));
}

async function createWamApp(targetDir: string, name: string) {
  const wamDir = join(targetDir, "apps", "wam");

  // package.json
  await writeFile(
    join(wamDir, "package.json"),
    JSON.stringify(
      {
        name: `@${name}/wam`,
        version: "0.0.1",
        private: true,
        type: "module",
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview",
          lint: "eslint src/",
        },
        dependencies: {
          "@channel.io/app-sdk": "^0.0.1",
          react: "^18.3.1",
          "react-dom": "^18.3.1",
        },
        devDependencies: {
          "@types/react": "^18.3.18",
          "@types/react-dom": "^18.3.5",
          "@vitejs/plugin-react": "^4.3.4",
          typescript: "^5.7.2",
          vite: "^6.0.7",
        },
      },
      null,
      2
    )
  );

  // vite.config.ts
  await writeFile(
    join(wamDir, "vite.config.ts"),
    `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
  },
});
`
  );

  // tsconfig.json
  await writeFile(
    join(wamDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          jsx: "react-jsx",
          lib: ["ES2022", "DOM"],
        },
        include: ["src/**/*"],
      },
      null,
      2
    )
  );

  // index.html
  await writeFile(
    join(wamDir, "index.html"),
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name} WAM</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
  );

  // main.tsx
  await writeFile(
    join(wamDir, "src", "main.tsx"),
    `import React from "react";
import ReactDOM from "react-dom/client";
import { WamProvider } from "@channel.io/app-sdk";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WamProvider>
      <App />
    </WamProvider>
  </React.StrictMode>
);
`
  );

  // App.tsx
  await writeFile(
    join(wamDir, "src", "App.tsx"),
    `import { useEffect } from "react";
import { useWamData, useWamSize, useCallFunction } from "@channel.io/app-sdk";

export default function App() {
  const appId = useWamData<string>("appId") ?? "";
  const channelId = useWamData<string>("channelId");
  const { setSize } = useWamSize();

  const { call, loading, data } = useCallFunction<{
    type: string;
    attributes?: { message?: string };
  }>({
    appId,
    name: "extension.command.command.execute",
  });

  useEffect(() => {
    setSize({ height: 300 });
  }, [setSize]);

  const handleClick = async () => {
    try {
      await call({
        chat: { type: "direct", id: channelId ?? "demo-chat" },
        trigger: { type: "wam-demo", attributes: {} },
        input: { target: "world" },
        language: "en",
      });
    } catch (error) {
      console.error("Failed to execute command:", error);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Channel.io App</h1>
      <p>Channel ID: {channelId}</p>

      <button onClick={handleClick} disabled={loading}>
        {loading ? "Executing..." : "Execute Command"}
      </button>

      {data && (
        <p style={{ color: "green" }}>
          {data.attributes?.message ?? data.type}
        </p>
      )}
    </div>
  );
}
`
  );
}

async function createSharedPackage(targetDir: string, name: string) {
  const sharedDir = join(targetDir, "packages", "shared");

  // package.json
  await writeFile(
    join(sharedDir, "package.json"),
    JSON.stringify(
      {
        name: `@${name}/shared`,
        version: "0.0.1",
        private: true,
        type: "module",
        main: "./dist/index.js",
        types: "./dist/index.d.ts",
        scripts: {
          build: "tsc",
          dev: "tsc --watch",
        },
        devDependencies: {
          typescript: "^5.7.2",
        },
      },
      null,
      2
    )
  );

  // tsconfig.json
  await writeFile(
    join(sharedDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          declaration: true,
          outDir: "./dist",
          rootDir: "./src",
        },
        include: ["src/**/*"],
      },
      null,
      2
    )
  );

  // index.ts
  await writeFile(
    join(sharedDir, "src", "index.ts"),
    `// Shared types and utilities
export interface AppConfig {
  appId: string;
  channelId: string;
}
`
  );
}
