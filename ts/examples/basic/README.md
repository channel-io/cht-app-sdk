# Basic Example

A minimal Channel.io app demonstrating the SDK basics.

## Features

- Command extension with a simple "hello" command
- WAM widget that calls the command

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env with your app credentials
# APP_ID=your-app-id
# APP_SECRET=your-app-secret

# Start development server
pnpm dev
```

## Project Structure

```
basic/
├── apps/
│   ├── server/          # NestJS backend
│   │   └── src/
│   │       ├── extensions/
│   │       │   └── command.extension.ts
│   │       ├── app.module.ts
│   │       └── main.ts
│   └── wam/             # React frontend
│       └── src/
│           ├── App.tsx
│           └── main.tsx
└── packages/
    └── shared/          # Shared types
```

## How It Works

### Server

The server registers a `command` extension and exposes command metadata through
`extension.command.metadata.getCommands`:

```typescript
export const commandExtension = createExtension({
  name: "command",
  groups: {
    metadata: {
      getCommands: defineFunction({
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
  },
});
```

### Command Registration

Command extensions are registered through `registerExtension("command", "v1")`, and
AppStore discovers command definitions by calling
`extension.command.metadata.getCommands`.

```typescript
@Extension({ name: "command", systemVersion: "v1" })
export class CommandExtension {
  @Func("metadata.getCommands")
  @OutputSchema(GetCommandsOutputSchema)
  async getCommands() {
    return {
      commands: [
        {
          name: "hello",
          scope: "desk",
          actionFunctionName: "extension.command.command.execute",
          alfMode: "disable",
        },
      ],
    };
  }
}
```

The same registration model applies to widget/custom tab extensions:

- Widget metadata: `extension.widget.metadata.getWidgets`
- Custom tab metadata: `extension.customtab.metadata.getCustomTabs`
- Runtime actions: plain app functions referenced by each definition's `actionFunctionName`

### WAM

The WAM widget can inspect the same command metadata and call the registered action function:

```typescript
const { call } = useCallFunction({
  appId,
  name: "extension.command.metadata.getCommands",
});

const { commands } = await call({});
```
