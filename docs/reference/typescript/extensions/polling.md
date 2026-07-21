# Polling Extension

Use polling when AppStore should schedule repeated channel-scoped app functions. AppStore owns scheduling and queueing; the app owns target discovery and poller logic.

Required functions:

- `extension.polling.metadata.getPollers`
- `extension.polling.target.getChannels`

```ts
import { z } from "zod";
import {
  Context,
  Ctx,
  Extension,
  Func,
  GetPollersOutputSchema,
  GetPollingTargetChannelsInputSchema,
  GetPollingTargetChannelsOutputSchema,
  Input,
  InputSchema,
  OutputSchema,
} from "@channel.io/app-sdk-server";

@Extension({ name: "polling", systemVersion: "v1" })
export class PollingExtension {
  @Func("metadata.getPollers")
  @InputSchema(z.object({}))
  @OutputSchema(GetPollersOutputSchema)
  getPollers() {
    return {
      pollers: [
        {
          functionName: "extension.polling.poller.pollQnAs",
          intervalSeconds: 900,
          timeoutSeconds: 30,
          maxConcurrency: 5,
          rps: 1,
        },
      ],
    };
  }

  @Func("target.getChannels")
  @InputSchema(GetPollingTargetChannelsInputSchema)
  @OutputSchema(GetPollingTargetChannelsOutputSchema)
  async getChannels(
    @Input() input: z.infer<typeof GetPollingTargetChannelsInputSchema>,
  ) {
    return listBoardEnabledChannels(input);
  }

  @Func("poller.pollQnAs")
  @InputSchema(z.object({}))
  @OutputSchema(z.object({}))
  async pollQnAs(@Ctx() ctx: Context) {
    await pollExternalBoard(ctx.channel.id);
    return {};
  }
}
```

## Poller fields

| Field             | Required | Description                                    |
| ----------------- | -------- | ---------------------------------------------- |
| `functionName`    | Yes      | Full function name called with channel context |
| `intervalSeconds` | Yes      | Run creation interval                          |
| `timeoutSeconds`  | No       | Per-call timeout; default `30`                 |
| `maxConcurrency`  | No       | Per-worker in-flight limit; default `5`        |
| `rps`             | No       | Per-worker rate limit; default `1`             |

The target resolver receives `functionName`, optional `cursor`, and `limit` (maximum 500). Return `channelIds`, optional `nextCursor`, and optional `hasNextPage`. If `hasNextPage` is true, `nextCursor` is required.

Enable `autoRegister` for the decorated class. AppStore reads poller metadata during `registerExtension("polling", "v1")` and requires the target resolver.
