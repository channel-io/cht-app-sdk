# WAM UI Components

`@channel.io/app-sdk-wam-ui` provides UI components for building WAM widgets that look consistent with Channel.io desk.

## When to Use

- **New WAM apps** — Start with `WamThemeProvider` + form components instead of building from scratch
- **Existing WAM apps** — Replace duplicated infrastructure code (theme setup, height sync, confirm modals)
- **Third-party apps** — Build WAM interfaces that blend naturally with Channel.io desk

## Relationship to Other Packages

```text
@channel.io/app-sdk-wam      ← Bridge layer (hooks for WAM data, function calls)
@channel.io/app-sdk-wam-ui   ← UI layer (theme, components, patterns)
@channel.io/bezier-react      ← Design system (low-level primitives)
```

`wam-ui` builds **on top of** bezier-react, providing higher-level patterns specific to WAM development.

## Getting Started

```tsx
import {
  WamThemeProvider,
  HeightSynchronizer,
} from "@channel.io/app-sdk-wam-ui";
import { WamProvider } from "@channel.io/app-sdk-wam";

function App() {
  return (
    <WamProvider>
      <WamThemeProvider>
        <HeightSynchronizer>
          <MyWidget />
        </HeightSynchronizer>
      </WamThemeProvider>
    </WamProvider>
  );
}
```

See the [package README](../../../ts/packages/wam-ui/README.md) for full API documentation.
