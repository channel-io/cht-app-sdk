# Channel.io App SDK Architecture

> TypeScript SDK for rapidly building Channel.io apps using the extension system

## Overview

This SDK enables developers to quickly build Channel.io apps by providing:

- Decorator-based extension implementation
- NestJS framework integration
- WAM (Web App Module) React utilities
- CLI tools for project scaffolding
- AI-friendly documentation (llms.txt)

## Repository Location

The TypeScript SDK lives under `ts/` in the `cht-app-sdk` monorepo. Published
npm package names and imports are unchanged.

## Package Structure

```
cht-app-sdk/
├── proto/                       # Shared SDK contracts
├── go/                          # Go SDK module
├── ts/
│   ├── packages/
│   │   ├── core/                # Core types, schemas, utilities
│   │   ├── server/              # NestJS and simple server SDK
│   │   ├── wam/                 # WAM React SDK
│   │   └── cli/                 # Project CLI
│   └── examples/                # TypeScript example apps
└── docs/
    ├── guides/                  # App developer guides
    └── reference/typescript/    # TypeScript SDK reference
```

## Supported Extensions

| Extension     | Function Groups                                         | Description                                    |
| ------------- | ------------------------------------------------------- | ---------------------------------------------- |
| **command**   | -                                                       | Chat slash commands                            |
| **oauth**     | metadata, validation                                    | OAuth 2.0 authentication                       |
| **apikey**    | metadata, validation                                    | API key authentication                         |
| **customtab** | -                                                       | Custom tab UI                                  |
| **widget**    | -                                                       | Widget UI                                      |
| **calendar**  | calendar, booking, bookingQuery                         | Calendar/booking system                        |
| **messenger** | inboxMessaging, prebuiltMessaging, followUp, mediumLink | Messenger integration (Kakao, NaverTalk, etc.) |
| **commerce**  | -                                                       | Commerce integration                           |
| **alfTask**   | -                                                       | ALF task                                       |
| **notebook**  | core                                                    | App-managed notebooks                          |

## Core Concepts

### Extension System

Extensions are predefined function collections with standardized interfaces. Each extension consists of:

- **Function Groups**: Logical grouping of related functions
- **Functions**: Individual callable methods with defined input/output schemas

### Naming Convention

Functions follow this naming pattern:

```
{groupName}.{functionName}
```

When registered in the app store, the full path becomes:

```
extension.{extensionName}.{groupName}.{functionName}
```

### System Version Management

Extensions support versioning for backward compatibility:

- Complete separation between versions (v1, v2)
- Easy migration path when upgrading system versions

## API Design

### 1. Extension Definition (Decorator-based)

```typescript
import { Extension, FunctionGroup, Func } from '@channel.io/app-sdk/server';
import { z } from 'zod';

@Extension({
  name: 'calendar',
  systemVersion: 1,
  exclusive: false,
})
export class CalendarExtension {

  @FunctionGroup('calendar')
  calendar = {
    @Func({
      description: 'List available calendars',
      inputSchema: z.object({
        userId: z.string().optional(),
      }),
      outputSchema: z.object({
        calendars: z.array(CalendarSchema),
      }),
    })
    listCalendars: async (ctx: Context, params: ListCalendarsInput) => {
      // Implementation
    },

    @Func({ ... })
    getAvailability: async (ctx: Context, params: GetAvailabilityInput) => {
      // Implementation
    },
  };

  @FunctionGroup('booking', { required: true })
  booking = {
    @Func({ ... })
    createBooking: async (ctx: Context, params: CreateBookingInput) => {
      // Implementation
    },
  };
}
```

### 2. Simplified Functional API

```typescript
import { createExtension, defineFunction } from '@channel.io/app-sdk/server';
import { z } from 'zod';

export const calendarExtension = createExtension({
  name: 'calendar',
  systemVersion: 1,
  groups: {
    calendar: {
      listCalendars: defineFunction({
        input: z.object({ userId: z.string().optional() }),
        output: z.object({ calendars: z.array(CalendarSchema) }),
        handler: async (ctx, params) => {
          return { calendars: [...] };
        },
      }),
    },
    booking: {
      createBooking: defineFunction({ ... }),
    },
  },
});
```

### 3. NestJS Module Integration

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { ChannelAppModule } from "@channel.io/app-sdk/server/nestjs";
import { CalendarExtension } from "./extensions/calendar.extension";
import { OAuthExtension } from "./extensions/oauth.extension";

@Module({
  imports: [
    ChannelAppModule.forRoot({
      appId: process.env.APP_ID,
      appSecret: process.env.APP_SECRET,
      extensions: [CalendarExtension, OAuthExtension],
    }),
  ],
})
export class AppModule {}
```

### 4. WAM SDK

```typescript
import {
  useWamData,
  useCallFunction,
  useNativeFunction,
  useWamSize
} from '@channel.io/app-sdk/wam';

function BookingWidget() {
  const channelId = useWamData('channelId');
  const appId = useWamData('appId');

  const { call: createBooking, loading } = useCallFunction<CreateBookingResponse>({
    appId,
    name: 'calendar.booking.createBooking',
  });

  const { setSize } = useWamSize();

  useEffect(() => {
    setSize({ height: 400 });
  }, []);

  const handleBook = async () => {
    const result = await createBooking({
      eventTypeId: '...',
      startTime: '...',
    });
  };

  return <button onClick={handleBook}>Book</button>;
}
```

## System Version Management

```typescript
// Version-separated extension definitions
@Extension({
  name: 'calendar',
  systemVersion: 1,
})
export class CalendarExtensionV1 { ... }

@Extension({
  name: 'calendar',
  systemVersion: 2,
})
export class CalendarExtensionV2 extends CalendarExtensionV1 {
  // Override or add new functions
}

// Automatic routing
ChannelAppModule.forRoot({
  extensions: {
    v1: [CalendarExtensionV1],
    v2: [CalendarExtensionV2],
  },
});
```

## Generated App Structure

```
my-channel-app/
├── apps/
│   ├── server/                  # NestJS backend
│   │   ├── src/
│   │   │   ├── extensions/      # Extension implementations
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── wam/                     # React frontend
│       ├── src/
│       │   ├── widgets/         # WAM widgets
│       │   └── App.tsx
│       └── package.json
│
├── packages/
│   └── shared/                  # Shared types/schemas
│
├── llms.txt                     # AI documentation
└── package.json                 # Monorepo root
```

## Key Differentiators

1. **Decorator-based**: Familiar NestJS-style patterns
2. **Zod Schemas**: Runtime validation + automatic TypeScript type inference
3. **WAM Integration**: Server/frontend development with same SDK
4. **llms.txt**: Optimized for AI code generation
5. **Version Management**: Easy system version upgrades
6. **CLI Tools**: Quick project scaffolding and code generation
