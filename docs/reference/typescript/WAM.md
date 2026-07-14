# WAM (Web App Module)

WAM is the frontend runtime for Channel app UI.
In practice, WAM is how command actions, widgets, and custom tabs render interactive experiences.

## Install

```bash
npm install @channel.io/app-sdk-wam
```

## When To Use WAM

Use WAM when a server-side extension action should open UI instead of returning plain text.

Common entry points:

- command action returns `{ type: "wam", attributes: ... }`
- widget action returns `{ type: "wam", attributes: ... }`
- custom tab action returns `{ type: "wam", attributes: ... }`

## Minimal Setup

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { WamProvider } from "@channel.io/app-sdk-wam";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WamProvider>
      <App />
    </WamProvider>
  </React.StrictMode>
);
```

## Core Hooks

### `useWamData()`

Read values injected by the Channel runtime.
The most common keys are:

- `appId`
- `channelId`
- `managerId`
- `chatId`
- `chatType`
- `rootMessageId`
- custom keys passed in `wamArgs`

### `useCallFunction()`

Call your own app function.
This is the main way a WAM UI talks back to your server extension logic.

```tsx
const appId = useWamData("appId") as string;
const { call, loading, error } = useCallFunction({
  appId,
  name: "calendar.booking.createBooking",
});
```

### `useNativeFunction()`

Call a Channel native function that is exposed to the current role and surface.
This is useful for manager-scoped OAuth or API key management flows, and for other runtime-native integrations.

```tsx
const { call } = useNativeFunction({
  name: "getOAuthAuthorizationURL",
});
```

### `useWamSize()`

Resize the current WAM window or panel.
Use it on mount and when content size changes.

### `useWamClose()`

Close the current WAM surface.

## Common Pattern

The usual WAM loop looks like this:

1. Read runtime context from `useWamData()`
2. Call app functions with `useCallFunction()`
3. Call native functions only when the flow really needs Channel-owned capabilities
4. Resize with `useWamSize()` when content changes

## Which Extensions Usually Open WAM

- Command
- Widget
- Custom tab
- Some OAuth or API key setup flows

Calendar is a good concrete example because it combines:

- server-side extension functions
- a WAM booking UI
- command/widget/custom-tab style action results if you choose to wrap it that way

## Best Practices

- Prefer `useCallFunction()` for your own business logic
- Treat `useNativeFunction()` as the boundary to Channel-owned capabilities
- Pass only the minimum needed `wamArgs`
- Set an initial size early
- Keep action handlers small and push real logic into app functions
