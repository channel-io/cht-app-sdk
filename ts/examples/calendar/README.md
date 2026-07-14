# Calendar Example

A calendar booking app demonstrating OAuth and calendar extensions.

## Features

- OAuth extension for authentication
- Calendar extension with:
  - Event type listing
  - Availability checking
  - Booking creation/cancellation
- WAM widget for booking interface

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# APP_ID=your-app-id
# APP_SECRET=your-app-secret
# OAUTH_CLIENT_ID=your-oauth-client-id
# OAUTH_CLIENT_SECRET=your-oauth-client-secret

# Start development server
pnpm dev
```

## Project Structure

```
calendar/
├── apps/
│   ├── server/
│   │   └── src/
│   │       ├── extensions/
│   │       │   ├── oauth.extension.ts
│   │       │   └── calendar.extension.ts
│   │       ├── app.module.ts
│   │       └── main.ts
│   └── wam/
│       └── src/
│           ├── components/
│           │   ├── EventTypeList.tsx
│           │   ├── AvailabilityPicker.tsx
│           │   └── BookingForm.tsx
│           ├── App.tsx
│           └── main.tsx
└── packages/
    └── shared/
        └── src/
            └── types.ts
```

## Extensions

### OAuth Extension

Handles authentication with calendar providers:

```typescript
oauthExtension = createExtension({
  name: "oauth",
  groups: {
    metadata: {
      getAuthConfig: defineFunction({ ... }),
    },
    validation: {
      validateCredentials: defineFunction({ ... }),
    },
  },
});
```

### Calendar Extension

Provides calendar and booking functionality:

```typescript
calendarExtension = createExtension({
  name: "calendar",
  groups: {
    calendar: {
      listEventTypes: defineFunction({ ... }),
      getAvailability: defineFunction({ ... }),
    },
    booking: {
      createBooking: defineFunction({ ... }),
      cancelBooking: defineFunction({ ... }),
    },
  },
});
```
