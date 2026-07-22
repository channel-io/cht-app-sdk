# Mail Relay Extension

The mail relay extension receives inbound SES mail events routed from an app-owned Channel mail domain such as `{slug}.mail.channel.io`.

Use this extension when an external service can only deliver customer messages through email notifications or mailbox forwarding, and each app needs provider-specific parsing and UserChat ingestion.

## Registration

Register the extension as:

```text
registerExtension("mailRelay", "v1")
```

The canonical function is:

```text
extension.mailRelay.inbound.onMailReceived
```

TypeScript `0.17.2` does not include `mailRelay` in the names accepted by the `@Extension` decorator. Register the full Function name as a standalone `@Func` and register the Extension explicitly:

```typescript
import {
  MailRelayFunctionNames,
  MailRelayInboundInputSchema,
  MailRelayInboundOutputSchema,
  type Context,
  type MailRelayInboundInput,
  type MailRelayInboundOutput,
} from "@channel.io/app-sdk-core";
import {
  Ctx,
  Func,
  Input,
  InputSchema,
  OutputSchema,
} from "@channel.io/app-sdk-server";

export class MailRelayFunctions {
  @Func(`extension.mailRelay.${MailRelayFunctionNames.inbound.onMailReceived}`)
  @InputSchema(MailRelayInboundInputSchema)
  @OutputSchema(MailRelayInboundOutputSchema)
  async onMailReceived(
    @Ctx() _ctx: Context,
    @Input() input: MailRelayInboundInput,
  ): Promise<MailRelayInboundOutput> {
    return {
      status: "accepted",
      idempotencyKey: `ses:${input.sesMessageId}`,
    };
  }
}
```

List `MailRelayFunctions` in the NestJS module's `providers`. After the HTTP server is listening, obtain a cached app token from `TokenManager` and call:

```ts
const token = await tokenManager.getAppToken();
await nativeClient.registerExtension(
  appId,
  "mailRelay",
  "v1",
  token.accessToken,
);
```

Do not issue a token or register the Extension for every inbound message. A deployment system may own this one-time registration step. Go applications can use the typed `extension/mailrelay` builder.

## Domains

Production recipients use:

```text
{slug}.mail.channel.io
```

The relay extracts the domain slug and forwards a normalized mail envelope to AppStore. AppStore resolves the slug against registered `mailRelay` Extensions and invokes the app Function using its configured endpoint. Apps own the local-part format, relay token validation, and idempotency rules.

Do not configure app-specific base URLs in the relay. The app Function Endpoint comes from the developer portal and is not part of the `mailRelay` Extension registration payload.

## Input

`MailRelayInboundInput` contains the normalized SES envelope:

- `slug`: app slug parsed from the recipient domain.
- `recipient`: the representative recipient routed to this app.
- `recipients`: all SES receipt recipients.
- `sesMessageId`: SES mail message id.
- `bucketName` and `objectKey`: S3 pointer for the raw MIME object.
- `mail`: SES mail metadata, common headers, and raw header list.
- `receipt`: SES verdict metadata.

The raw MIME body is not included in the function input.

## Output

`MailRelayInboundOutput.status` tells the relay how to treat the event:

- `accepted`: accepted for processing.
- `ignored`: invalid or irrelevant recipient.
- `duplicate`: already processed.
- `retryableFailure`: temporary failure; the relay may retry delivery.
- `permanentFailure`: non-retryable failure.

Do not return raw MIME content, attachment content, or provider PII in `reason`.
