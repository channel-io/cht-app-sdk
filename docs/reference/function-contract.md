# Function Contract

Channel app functions use a JSON-RPC-like envelope.

## Request

```json
{
  "method": "extension.example.getThing",
  "params": {},
  "context": {
    "caller": { "type": "manager", "id": "manager-id" },
    "channel": { "id": "channel-id" },
    "authToken": "access-token"
  },
  "systemVersion": "v1"
}
```

`method` identifies the function. `params` is function-specific JSON. `context`
contains Channel runtime data and credentials. `systemVersion` selects the
extension system version when the app supports more than one version.

## Response

Successful functions return:

```json
{ "result": {} }
```

Failed functions return:

```json
{
  "error": {
    "code": 2,
    "type": "invalidParams",
    "message": "failed to decode params"
  }
}
```

`extension.core.function.getFunctions` is reserved. SDK handlers answer it by
returning function schemas for registration and runtime discovery.
