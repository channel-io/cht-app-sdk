# Extensions

This document is the overview page for the SDK's extension contracts.
For implementation details, use the per-extension guides in [docs/reference/typescript/extensions](./extensions/README.md).

## What Counts As An Extension

An extension is a named function surface served by your app and registered into AppStore with a `systemVersion`.
At runtime, AppStore calls functions with names shaped like:

```text
extension.{extensionName}.{groupName}.{functionName}
```

## Implementation Style

Today the most reliable implementation strategy is:

- `createExtension()`
- `defineFunction()`
- or decorators from `@channel.io/app-sdk-server`

That recommendation is shared across command, widget, custom tab, hook, polling, store, notebook, calendar, OAuth, Config, legacy API key, and ALF task.

## Start From These Pages

- [Extension Guide Index](./extensions/README.md)
- [Command](./extensions/command.md)
- [Config](./extensions/config.md)
- [OAuth](./extensions/oauth.md)
- [API Key legacy/deprecated](./extensions/apikey.md)
- [Calendar](./extensions/calendar.md)
- [Widget](./extensions/widget.md)
- [Custom Tab](./extensions/customtab.md)
- [Hook](./extensions/hook.md)
- [Mail Relay](./extensions/mail-relay.md)
- [Polling](./extensions/polling.md)
- [Store](./extensions/store.md)
- [Messaging Family](./extensions/messaging.md)
- [ALF Task](./extensions/alf-task.md)
- [Notebook](./extensions/notebook.md)

## Important Caveat

The repository still contains a few older snippets and CLI templates that do not exactly match the current AppStore contract.
If something disagrees, prefer the extension guides above and the SDK source files referenced from [AGENT.md](../AGENT.md).

| Function              | Description       | Required |
| --------------------- | ----------------- | -------- |
| `validateCredentials` | Validates API key | Yes      |

---

## Calendar Extension

Provides calendar and booking functionality.

### Function Groups

#### calendar

| Function          | Description                 | Required |
| ----------------- | --------------------------- | -------- |
| `listCalendars`   | Lists available calendars   | Yes      |
| `listEventTypes`  | Lists available event types | Yes      |
| `getAvailability` | Gets available time slots   | Yes      |

#### booking

| Function            | Description                     | Required |
| ------------------- | ------------------------------- | -------- |
| `createBooking`     | Creates a new booking           | Yes      |
| `rescheduleBooking` | Reschedules an existing booking | No       |
| `cancelBooking`     | Cancels a booking               | No       |

#### bookingQuery

| Function            | Description                        | Required |
| ------------------- | ---------------------------------- | -------- |
| `getBookings`       | Lists bookings with filters        | Yes      |
| `getBookingDetails` | Gets details of a specific booking | Yes      |

### Example

````typescript
import { createExtension, defineFunction } from "@channel.io/app-sdk/server";
import { z } from "zod";

const CalendarSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

const EventTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.number(),
  description: z.string().optional(),
});

const BookingSchema = z.object({
  id: z.string(),
  eventTypeId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  attendee: z.object({
    name: z.string(),
    email: z.string(),
  }),
  status: z.enum(["confirmed", "cancelled", "pending"]),
});

export const calendarExtension = createExtension({
  name: "calendar",
  systemVersion: 1,
  groups: {
    calendar: {
      listCalendars: defineFunction({
        input: z.object({
          userId: z.string().optional(),
        }),
        output: z.object({
          calendars: z.array(CalendarSchema),
        }),
        handler: async (ctx, params) => {
          // Fetch calendars from provider
          return { calendars: [] };
        },
      }),

      listEventTypes: defineFunction({
        input: z.object({
          calendarId: z.string().optional(),
        }),
        output: z.object({
          eventTypes: z.array(EventTypeSchema),
        }),
        handler: async (ctx, params) => {
          return { eventTypes: [] };
        },
      }),

      getAvailability: defineFunction({
        input: z.object({
          eventTypeId: z.string(),
          startDate: z.string(),
          endDate: z.string(),
          timezone: z.string().optional(),
        }),
        output: z.object({
          slots: z.array(
            z.object({
              startTime: z.string(),
              endTime: z.string(),
            })
          ),
        }),
        handler: async (ctx, params) => {
          return { slots: [] };
        },
      }),
    },

    booking: {
      createBooking: defineFunction({
        input: z.object({
          eventTypeId: z.string(),
          startTime: z.string(),
          attendee: z.object({
            name: z.string(),
            email: z.string(),
          }),
          notes: z.string().optional(),
        }),
        output: z.object({
          booking: BookingSchema,
        }),
        handler: async (ctx, params) => {
          // Create booking with provider
          return {
            booking: {
              id: "booking-123",
              eventTypeId: params.eventTypeId,
              startTime: params.startTime,
              endTime: "...", // Calculate based on event type duration
              attendee: params.attendee,
              status: "confirmed",
            },
          };
        },
      }),

      cancelBooking: defineFunction({
        input: z.object({
          bookingId: z.string(),
          reason: z.string().optional(),
        }),
        output: z.object({
          success: z.boolean(),
        }),
        handler: async (ctx, params) => {
          return { success: true };
        },
      }),
    },

    bookingQuery: {
      getBookings: defineFunction({
        input: z.object({
          status: z.enum(["confirmed", "cancelled", "pending"]).optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          limit: z.number().optional(),
          cursor: z.string().optional(),
        }),
        output: z.object({
          bookings: z.array(BookingSchema),
          nextCursor: z.string().optional(),
        }),
        handler: async (ctx, params) => {
          return { bookings: [] };
        },
      }),
| Function              | Description       | Required |
| --------------------- | ----------------- | -------- |
| `validateCredentials` | Validates API key | Yes      |

---

## Calendar Extension

Provides calendar and booking functionality.

### Function Groups

#### calendar

| Function          | Description                 | Required |
| ----------------- | --------------------------- | -------- |
| `listCalendars`   | Lists available calendars   | Yes      |
| `listEventTypes`  | Lists available event types | Yes      |
| `getAvailability` | Gets available time slots   | Yes      |

#### booking

| Function            | Description                     | Required |
| ------------------- | ------------------------------- | -------- |
| `createBooking`     | Creates a new booking           | Yes      |
| `rescheduleBooking` | Reschedules an existing booking | No       |
| `cancelBooking`     | Cancels a booking               | No       |

#### bookingQuery

| Function            | Description                        | Required |
| ------------------- | ---------------------------------- | -------- |
| `getBookings`       | Lists bookings with filters        | Yes      |
| `getBookingDetails` | Gets details of a specific booking | Yes      |

### Example

```typescript
import { createExtension, defineFunction } from "@channel.io/app-sdk/server";
import { z } from "zod";

const CalendarSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

const EventTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.number(),
  description: z.string().optional(),
});

const BookingSchema = z.object({
  id: z.string(),
  eventTypeId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  attendee: z.object({
    name: z.string(),
    email: z.string(),
  }),
  status: z.enum(["confirmed", "cancelled", "pending"]),
});

export const calendarExtension = createExtension({
  name: "calendar",
  systemVersion: 1,
  groups: {
    calendar: {
      listCalendars: defineFunction({
        input: z.object({
          userId: z.string().optional(),
        }),
        output: z.object({
          calendars: z.array(CalendarSchema),
        }),
        handler: async (ctx, params) => {
          // Fetch calendars from provider
          return { calendars: [] };
        },
      }),

      listEventTypes: defineFunction({
        input: z.object({
          calendarId: z.string().optional(),
        }),
        output: z.object({
          eventTypes: z.array(EventTypeSchema),
        }),
        handler: async (ctx, params) => {
          return { eventTypes: [] };
        },
      }),

      getAvailability: defineFunction({
        input: z.object({
          eventTypeId: z.string(),
          startDate: z.string(),
          endDate: z.string(),
          timezone: z.string().optional(),
        }),
        output: z.object({
          slots: z.array(
            z.object({
              startTime: z.string(),
              endTime: z.string(),
            })
          ),
        }),
        handler: async (ctx, params) => {
          return { slots: [] };
        },
      }),
    },

    booking: {
      createBooking: defineFunction({
        input: z.object({
          eventTypeId: z.string(),
          startTime: z.string(),
          attendee: z.object({
            name: z.string(),
            email: z.string(),
          }),
          notes: z.string().optional(),
        }),
        output: z.object({
          booking: BookingSchema,
        }),
        handler: async (ctx, params) => {
          // Create booking with provider
          return {
            booking: {
              id: "booking-123",
              eventTypeId: params.eventTypeId,
              startTime: params.startTime,
              endTime: "...", // Calculate based on event type duration
              attendee: params.attendee,
              status: "confirmed",
            },
          };
        },
      }),

      cancelBooking: defineFunction({
        input: z.object({
          bookingId: z.string(),
          reason: z.string().optional(),
        }),
        output: z.object({
          success: z.boolean(),
        }),
        handler: async (ctx, params) => {
          return { success: true };
        },
      }),
    },

    bookingQuery: {
      getBookings: defineFunction({
        input: z.object({
          status: z.enum(["confirmed", "cancelled", "pending"]).optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          limit: z.number().optional(),
          cursor: z.string().optional(),
        }),
        output: z.object({
          bookings: z.array(BookingSchema),
          nextCursor: z.string().optional(),
        }),
        handler: async (ctx, params) => {
          return { bookings: [] };
        },
      }),

      getBookingDetails: defineFunction({
        input: z.object({
          bookingId: z.string(),
        }),
        output: z.object({
          booking: BookingSchema,
        }),
        handler: async (ctx, params) => {
          // Fetch booking details
          throw new Error("Booking not found");
        },
      }),
    },
  },
});
````

---

## WMS Extension

Provides warehouse/order-management capabilities for WMS integrations such as EzAdmin.

### Function Groups

#### metadata

| Function                                       | Description                        | Required |
| ---------------------------------------------- | ---------------------------------- | -------- |
| `extension.wms.metadata.getSupportedCommerces` | Lists supported commerce app types | No       |

#### core

| Function                       | Description                            | Required |
| ------------------------------ | -------------------------------------- | -------- |
| `extension.wms.core.getOrders` | Lists WMS orders                       | Yes      |
| `extension.wms.core.getOrder`  | Gets a single WMS order                | No       |
| `extension.wms.core.getShopId` | Resolves or returns configured shop ID | No       |

#### cancel

| Function                            | Description                    | Required |
| ----------------------------------- | ------------------------------ | -------- |
| `extension.wms.cancel.cancelOrder`  | Cancels WMS order(s)           | Yes      |
| `extension.wms.cancel.restoreOrder` | Restores canceled WMS order(s) | No       |

#### return

| Function                            | Description                    | Required |
| ----------------------------------- | ------------------------------ | -------- |
| `extension.wms.return.returnOrder`  | Marks WMS order(s) as return   | Yes      |
| `extension.wms.return.restoreOrder` | Restores returned WMS order(s) | No       |

#### exchange

| Function                               | Description                     | Required |
| -------------------------------------- | ------------------------------- | -------- |
| `extension.wms.exchange.exchangeOrder` | Marks WMS order(s) as exchange  | Yes      |
| `extension.wms.exchange.restoreOrder`  | Restores exchanged WMS order(s) | No       |

#### edit

| Function                                   | Description              | Required |
| ------------------------------------------ | ------------------------ | -------- |
| `extension.wms.edit.changeShippingAddress` | Changes shipping address | Yes      |

`extension.wms.core.getShopId` accepts a commerce-scoped lookup envelope. Use
`commerceType` plus a canonical `commerceKey`. Treat `commerceKey` as an opaque
commerce-defined string.

| Commerce         | `commerceType`       | `commerceKey` format                           |
| ---------------- | -------------------- | ---------------------------------------------- |
| Cafe24           | `appCafe24`          | `{encode(mallId)}-{shopNo}-{encode(shopName)}` |
| Naver SmartStore | `appNaverSmartStore` | `{encode(accountId)}-{encode(accountUid)}`     |

When a commerce needs multiple identity parts, percent-encode value parts
before joining them with `-`. Cafe24 percent-encodes `mallId` and `shopName`
while keeping `shopNo` unencoded as shown above. A literal `-` inside a value
must be forced to `%2D` even though it is normally an unreserved URL character.
WMS apps should split on unencoded `-` before decoding each part. This keeps
keys reversible even when source values contain `-`.

Cafe24 producers must emit the three-part canonical key. WMS readers should
continue accepting the legacy `{mallId}-{shopNo}` key; for canonical keys they
read `mallId` and `shopNo` from the front, while legacy parsing keeps the final
separator rule.

Naver SmartStore producers must emit exactly two non-empty parts. WMS readers
decode them as `accountId` and `accountUid`, in that order.

`extension.wms.metadata.getSupportedCommerces` returns `commerceTypes`, for
example `["appCafe24"]`, so commerce apps can list only compatible WMS apps.

WMS order items include optional `productName` and `quantity` fields. The SDK
continues to accept legacy `shippingInfo` on items for existing apps, but it is
not required by the current WMS SSOT.

Cancel, return, and exchange inputs prefer `orderId`. The legacy comma-separated
`orderIds` field remains accepted for compatibility.

The SDK exports WMS Zod schemas from `@channel.io/app-sdk-core`, including
`GetWmsOrdersInputSchema`, `GetWmsShopIdOutputSchema`, `CancelWmsOrderInputSchema`,
and `WmsSuccessOutputSchema`, so apps can attach the shared contracts directly.

---

## Messenger Extension

Provides third-party messenger integration (Kakao, NaverTalk, LINE, Instagram, etc.).

### Function Groups

#### inboxMessaging

| Function                 | Description                                   | Required |
| ------------------------ | --------------------------------------------- | -------- |
| `onMediumMessageCreated` | Handles incoming messages from messenger      | Yes      |
| `onMediumUserChatClosed` | Handles Channel user chat close notifications | No       |
| `sendMessage`            | Sends message to messenger                    | Yes      |

#### prebuiltMessaging

| Function            | Description              | Required |
| ------------------- | ------------------------ | -------- |
| `buildMediumTopics` | Builds medium topic list | No       |

#### followUp

| Function            | Description                  | Required |
| ------------------- | ---------------------------- | -------- |
| `getFollowUpConfig` | Gets follow-up configuration | No       |

#### mediumLink

| Function       | Description              | Required |
| -------------- | ------------------------ | -------- |
| `linkMedium`   | Links a medium account   | No       |
| `unlinkMedium` | Unlinks a medium account | No       |

---

## Command Extension

Provides chat slash command functionality.

### Functions

| Function         | Description              | Required |
| ---------------- | ------------------------ | -------- |
| `execute`        | Executes the command     | Yes      |
| `getSuggestions` | Gets command suggestions | No       |

---

## Widget Extension

Provides widget UI functionality.

### Functions

| Function   | Description            | Required |
| ---------- | ---------------------- | -------- |
| `render`   | Renders widget content | Yes      |
| `onAction` | Handles widget actions | No       |

---

## Custom Tab Extension

Provides custom tab UI in the desk.

### Functions

| Function   | Description         | Required |
| ---------- | ------------------- | -------- |
| `render`   | Renders tab content | Yes      |
| `onAction` | Handles tab actions | No       |

---

## Commerce Extension

Provides e-commerce integration.

### Function Groups

(To be documented)

---

## Store Extension

Provides AppStore presentation metadata such as value proposition, target users, media, setup guidance, related apps, and FAQs.

### Function Groups

#### metadata

| Function          | Description                               | Required |
| ----------------- | ----------------------------------------- | -------- |
| `getStoreProfile` | Returns the AppStore presentation profile | Yes      |

---

## ALF Task Extension

Provides ALF (AI) task integration.

### Function Groups

(To be documented)

---

## Notebook Extension

Provides app-managed notebook definitions.

See [Notebook](./extensions/notebook.md).

---

## Extension Types

### Exclusive vs Non-Exclusive

- **Exclusive Extension**: Only one app can be the default provider for the channel (e.g., calendar)
- **Non-Exclusive Extension**: Multiple apps can provide the extension simultaneously (e.g., command)

### System Versions

Extensions are versioned to allow backward compatibility. When a new system version is released:

1. Create a new extension class for the new version
2. Maintain the old version for existing installations
3. New installations use the latest version

```typescript
@Extension({ name: 'calendar', systemVersion: 1 })
export class CalendarExtensionV1 { ... }

@Extension({ name: 'calendar', systemVersion: 2 })
export class CalendarExtensionV2 extends CalendarExtensionV1 {
  // New or modified functions
}
```
