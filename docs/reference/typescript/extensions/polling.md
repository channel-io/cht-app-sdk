# Polling Extension

Use the polling extension when AppStore should schedule repeated channel-scoped app functions for you.

This is intended for new polling apps that would otherwise create their own cron or poller. AppStore owns the shared scheduling and queueing pipeline, while the app owns the polling function logic.

## Required Functions

- `extension.polling.metadata.getPollers`
- `extension.polling.target.getChannels`

The metadata function returns the polling functions AppStore should schedule.

```typescript
import { createExtension, defineFunction, GetPollersOutputSchema } from "@channel.io/app-sdk";
import { z } from "zod";

export const pollingExtension = createExtension({
  name: "polling",
  systemVersion: "v1",
  groups: {
    metadata: {
      getPollers: defineFunction({
        input: z.object({}),
        output: GetPollersOutputSchema,
        handler: async () => ({
          pollers: [
            {
              functionName: "extension.polling.poller.pollQnAs",
              intervalSeconds: 900,
              timeoutSeconds: 30,
              maxConcurrency: 5,
              rps: 1,
            },
          ],
        }),
      }),
    },
  },
});
```

## Poller Fields

| Field             | Required | Description                                                 |
| ----------------- | -------- | ----------------------------------------------------------- |
| `functionName`    | Yes      | Full app function name AppStore calls with channel context. |
| `intervalSeconds` | Yes      | How often AppStore creates a run for this polling function. |
| `timeoutSeconds`  | No       | Per-call timeout in seconds. AppStore defaults to `30`.     |
| `maxConcurrency`  | No       | Per-handler in-flight call limit. AppStore defaults to `5`. |
| `rps`             | No       | Per-handler request rate limit. AppStore defaults to `1`.   |

Polling functions receive `{}` as params and a normal channel context.

```typescript
poller: {
  pollQnAs: defineFunction({
    input: z.object({}),
    output: z.object({}).passthrough(),
    handler: async (ctx) => {
      await pollExternalBoard(ctx.channel.id);
      return {};
    },
  }),
}
```

## Target Resolver

Implement `extension.polling.target.getChannels` to return the channel page for the polling function AppStore is currently enqueueing.

AppStore does not infer targets from installed channels. If a channel should be polled, return it from this function.

```typescript
import {
  GetPollingTargetChannelsInputSchema,
  GetPollingTargetChannelsOutputSchema,
} from "@channel.io/app-sdk";

target: {
  getChannels: defineFunction({
    input: GetPollingTargetChannelsInputSchema,
    output: GetPollingTargetChannelsOutputSchema,
    handler: async (_ctx, params) => {
      const page = await listBoardEnabledChannels({
        cursor: params.cursor,
        limit: params.limit,
      });

      return {
        channelIds: page.channelIds,
        nextCursor: page.nextCursor,
        hasNextPage: page.hasNextPage,
      };
    },
  }),
}
```

Target resolver input:

| Field          | Description                                       |
| -------------- | ------------------------------------------------- |
| `functionName` | Polling function name currently being enqueued.   |
| `cursor`       | Previous `nextCursor`, omitted on the first page. |
| `limit`        | Maximum page size. AppStore sends at most `500`.  |

Target resolver output:

| Field         | Description                                             |
| ------------- | ------------------------------------------------------- |
| `channelIds`  | Channel IDs to enqueue for this page.                   |
| `nextCursor`  | Cursor for the next page. Omit when paging is complete. |
| `hasNextPage` | Optional boolean hint. If true, also return a cursor.   |

## Registration

Register the extension through:

- `registerExtension("polling", "v1")`

AppStore reads `getPollers` during extension registration and updates the scheduler registration from that metadata. The target resolver must also be implemented for the polling extension registration to succeed.
