# @channel.io/app-sdk

> TypeScript SDK for building Channel.io apps with the extension system

## Features

- **Decorator-based API**: NestJS-style decorators for clean extension code
- **MCP-like Simple API**: Minimal setup for quick prototyping
- **WAM SDK**: React hooks for frontend widgets
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Auto-discovery**: Extensions are automatically discovered at runtime
- **Testing Utilities**: Built-in helpers for unit testing extensions

## Installation

```bash
npm install @channel.io/app-sdk-server @channel.io/app-sdk-core
# For WAM (frontend)
npm install @channel.io/app-sdk-wam
```

## Quick Start

```bash
# Create a new app
npx @channel.io/app-sdk create my-app --template=calendar

# Navigate to project
cd my-app

# Start development
npm run dev
```

## Usage

### Decorator API (Recommended)

Best for production apps with dependency injection and testability.

```typescript
// src/extensions/calendar.extension.ts
import {
  Extension,
  Func,
  Ctx,
  Input,
  InputSchema,
  OutputSchema,
  Description,
} from "@channel.io/app-sdk-server";
import { z } from "zod";
import type { FunctionContext } from "@channel.io/app-sdk-server";

const GetAvailabilityInput = z.object({
  eventTypeId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

const GetAvailabilityOutput = z.object({
  slots: z.array(
    z.object({
      startTime: z.string(),
      endTime: z.string(),
    })
  ),
});

@Extension({ name: "calendar", systemVersion: "v1" })
export class CalendarExtension {
  // Dependency injection works!
  constructor(private readonly calendarService: CalendarService) {}

  @Func("calendar.getAvailability")
  @Description("Get available time slots for booking")
  @InputSchema(GetAvailabilityInput)
  @OutputSchema(GetAvailabilityOutput)
  async getAvailability(
    @Ctx() ctx: FunctionContext,
    @Input() params: z.infer<typeof GetAvailabilityInput>
  ) {
    return this.calendarService.getSlots(ctx.channel.id, params);
  }

  @Func("calendar.createBooking")
  @Description("Create a new booking")
  @InputSchema(CreateBookingInput)
  async createBooking(@Ctx() ctx: FunctionContext, @Input() params) {
    return { bookingId: "123", status: "confirmed" };
  }
}
```

```typescript
// src/app.module.ts
import { Module } from "@nestjs/common";
import { ChannelAppModule } from "@channel.io/app-sdk-server";
import { CalendarExtension } from "./extensions/calendar.extension";
import { CalendarService } from "./services/calendar.service";

@Module({
  imports: [
    ChannelAppModule.forRoot({
      appId: process.env.APP_ID,
      appSecret: process.env.APP_SECRET,
    }),
  ],
  providers: [CalendarExtension, CalendarService], // Auto-discovered!
})
export class AppModule {}
```

### Simple API (MCP-like)

Best for quick prototyping and simple apps.

```typescript
import { ChannelApp } from "@channel.io/app-sdk-server";
import { z } from "zod";

const app = new ChannelApp({
  appId: process.env.APP_ID!,
  appSecret: process.env.APP_SECRET!,
})
  .function(
    "calendar.getAvailability",
    z.object({ startDate: z.string(), endDate: z.string() }),
    async (ctx, { startDate, endDate }) => {
      return { slots: [] };
    }
  )
  .function(
    "calendar.createBooking",
    z.object({ slotId: z.string(), attendeeName: z.string() }),
    async (ctx, params) => {
      return { bookingId: `booking-${Date.now()}`, status: "confirmed" };
    }
  );

// Use in NestJS module
@Module({
  imports: [app.toModule()],
})
export class AppModule {}
```

### WAM (Frontend)

```typescript
import { useWamData, useCallFunction } from "@channel.io/app-sdk-wam";

function BookingWidget() {
  const appId = useWamData("appId");
  const { call, loading } = useCallFunction({
    appId,
    name: "calendar.createBooking",
  });

  return (
    <button onClick={() => call({ slotId: "123", attendeeName: "John" })}>
      {loading ? "Booking..." : "Book Now"}
    </button>
  );
}
```

## Testing

Use the built-in testing utilities to unit test your extensions:

```typescript
import { createTestExtension, createMockContext } from "@channel.io/app-sdk-server";
import { CalendarExtension } from "./calendar.extension";

describe("CalendarExtension", () => {
  it("should list event types", async () => {
    const { callFunction } = createTestExtension(CalendarExtension);

    const result = await callFunction("calendar.listEventTypes", {});

    expect(result.eventTypes).toHaveLength(3);
  });

  it("should get availability with custom context", async () => {
    const { callFunction } = createTestExtension(CalendarExtension);

    const result = await callFunction(
      "calendar.getAvailability",
      { eventTypeId: "1", startDate: "2024-01-01", endDate: "2024-01-02" },
      { channelId: "custom-channel" }
    );

    expect(result.slots).toBeDefined();
  });
});
```

## Decorators Reference

| Decorator       | Target    | Description                              |
| --------------- | --------- | ---------------------------------------- |
| `@Extension`    | Class     | Marks a class as a Channel.io extension  |
| `@Func`         | Method    | Marks a method as an extension function  |
| `@Ctx`          | Parameter | Injects the function context             |
| `@Input`        | Parameter | Injects validated input parameters       |
| `@Body`         | Parameter | Injects raw request body                 |
| `@InputSchema`  | Method    | Defines Zod schema for input validation  |
| `@OutputSchema` | Method    | Defines Zod schema for output validation |
| `@Description`  | Method    | Adds description for documentation       |

## Documentation

- [Architecture](../docs/reference/typescript/ARCHITECTURE.md) - SDK structure and design
- [Extensions](../docs/reference/typescript/EXTENSIONS.md) - Available extensions reference
- [WAM SDK](../docs/reference/typescript/WAM.md) - Frontend widget development
- [CLI](../docs/reference/typescript/CLI.md) - Command line tools

## License

MIT
