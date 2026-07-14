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

With decorators, implement the relative function name:

```typescript
import {
  MailRelayFunctionNames,
  MailRelayInboundInputSchema,
  MailRelayInboundOutputSchema,
  type MailRelayExtensionInterface,
} from "@channel.io/app-sdk-core";
import { Ctx, Extension, Func, Input, InputSchema, OutputSchema } from "@channel.io/app-sdk-server";

@Extension({ name: "mailRelay", systemVersion: "v1" })
export class ExampleMailRelayExtension implements MailRelayExtensionInterface {
  @Func(MailRelayFunctionNames.inbound.onMailReceived)
  @InputSchema(MailRelayInboundInputSchema)
  @OutputSchema(MailRelayInboundOutputSchema)
  async onMailReceived(@Ctx() ctx, @Input() input) {
    return {
      status: "accepted",
      idempotencyKey: `ses:${input.sesMessageId}`,
    };
  }
}
```

## Domains

Production recipients use:

```text
{slug}.mail.channel.io
```

The proxy extracts the domain slug only and forwards the normalized SES envelope to AppStore. AppStore resolves the slug against registered `mailRelay` extensions and invokes the app function using the app's server settings. Apps own the local-part format, relay token validation, and idempotency rules.

Do not configure app-specific base URLs in the proxy. The app function endpoint belongs to AppStore developer server settings (`function_endpoint`) and is not part of the `mailRelay` extension registration payload.

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

`MailRelayInboundOutput.status` tells the proxy how to treat the event:

- `accepted`: accepted for processing.
- `ignored`: invalid or irrelevant recipient.
- `duplicate`: already processed.
- `retryableFailure`: temporary failure; proxy may surface a retryable HTTP failure.
- `permanentFailure`: non-retryable failure.

Do not return raw MIME content, attachment content, or provider PII in `reason`.
