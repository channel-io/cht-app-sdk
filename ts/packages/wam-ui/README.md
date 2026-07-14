# @channel.io/app-sdk-wam-ui

UI components for [Channel.io](https://channel.io) WAM (Web App Module) development.

Build desk-consistent WAM interfaces without reinventing common patterns.

## Installation

```bash
npm install @channel.io/app-sdk-wam-ui
# peer dependencies
npm install react @channel.io/bezier-react styled-components
```

## Quick Start

```tsx
import { WamThemeProvider, FormSection, FormRow, ToggleRow } from "@channel.io/app-sdk-wam-ui";
import { TextField } from "@channel.io/bezier-react";

function App() {
  return (
    <WamThemeProvider>
      <FormSection title="Notification Settings" description="Configure when to send alerts.">
        <FormRow label="Name">
          <TextField value={name} onChange={(e) => setName(e.target.value)} size="m" />
        </FormRow>
        <ToggleRow
          label="Enable"
          description="Turn this notification on or off."
          checked={enabled}
          onChange={setEnabled}
        />
      </FormSection>
    </WamThemeProvider>
  );
}
```

## Components

### Infrastructure

Components that solve common WAM boilerplate across all apps.

#### `WamThemeProvider`

Wraps your WAM with `BezierAppProvider` + `ToastProvider`, auto-detecting the theme from Channel.io desk.

```tsx
<WamThemeProvider>
  <MyWidget />
</WamThemeProvider>

// Or override the theme
<WamThemeProvider theme="dark">
  <MyWidget />
</WamThemeProvider>
```

#### `HeightSynchronizer`

Automatically syncs iframe height with content using `ResizeObserver` + `window.ChannelIOWam.setSize()`.

```tsx
<HeightSynchronizer>
  <MyContent />
</HeightSynchronizer>

// Exclude specific routes from height sync
<HeightSynchronizer excludePaths={['/connect']} pathname={location.pathname}>
  <MyContent />
</HeightSynchronizer>

// Limit max height
<HeightSynchronizer maxHeight={600}>
  <MyContent />
</HeightSynchronizer>
```

#### `ConfirmDialog`

Desk-style confirmation dialog. Works standalone or with `@ebay/nice-modal-react`.

```tsx
// Standalone
<ConfirmDialog
  show={isOpen}
  onHide={() => setIsOpen(false)}
  title="Delete this item?"
  description="This action cannot be undone."
  destructive
  confirmText="Delete"
  onConfirm={handleDelete}
/>;

// With NiceModal
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { ConfirmDialog } from "@channel.io/app-sdk-wam-ui";

const MyConfirm = NiceModal.create((props) => {
  const { visible, remove } = useModal();
  return <ConfirmDialog {...props} show={visible} onHide={remove} />;
});
```

#### `LoadingPage` / `ErrorPage`

Full-page loading spinner and error fallback.

```tsx
if (loading) return <LoadingPage message="Loading data..." />;
if (error) return <ErrorPage error={error} onRetry={refetch} />;
```

### Design

Desk-consistent UI patterns extracted from Channel.io desk pages. Ideal for new WAM apps and third-party developers.

#### `FormSection`

Groups form fields under a title with optional description.

```tsx
<FormSection title="General" description="Basic settings for your integration.">
  {/* FormRow, ToggleRow, InputRow, etc. */}
</FormSection>
```

#### `FormRow`

Responsive label + field layout. Horizontal grid on wide viewports, vertical stack on narrow.

```tsx
<FormRow label="API Key" description="Your secret API key.">
  <TextField value={apiKey} onChange={...} size="m" />
</FormRow>
```

#### `InputRow` / `SelectRow` / `ToggleRow`

Pre-composed FormRow variants for common field types.

```tsx
<InputRow label="Webhook URL" value={url} onChange={setUrl} placeholder="https://..." />
<SelectRow label="Frequency" options={[...]} value={freq} onChange={setFreq} />
<ToggleRow label="Active" description="Enable this webhook." checked={active} onChange={setActive} />
```

#### `EmptyState`

Empty state display with icon, title, description, and optional action.

```tsx
import { InboxIcon } from "@channel.io/bezier-icons";

<EmptyState
  icon={InboxIcon}
  title="No messages yet"
  description="Messages will appear here."
  action={{ text: "Refresh", onClick: refetch }}
/>;
```

## Peer Dependencies

| Package                    | Version                     |
| -------------------------- | --------------------------- |
| `react`                    | >=17.0.0                    |
| `@channel.io/bezier-react` | >=3.0.0 \|\| >=4.0.0-next.0 |
| `styled-components`        | >=6.0.0                     |

Optional: `@ebay/nice-modal-react` >=1.0.0 (for `ConfirmDialog` NiceModal integration)

## License

MIT
