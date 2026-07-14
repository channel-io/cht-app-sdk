# Calendar Extension

Use the calendar extension when your app exposes availability lookup, booking creation, and booking queries.

## Typical Function Groups

- `calendar`
  - `listCalendars`
  - `listEventTypes`
  - `getAvailability`
- `booking`
  - `createBooking`
  - `cancelBooking`
  - `rescheduleBooking` if your provider supports it
- `bookingQuery`
  - `getBookings`
  - `getBookingDetails`

The exact set can vary, but these group names match the current SDK interfaces and examples.

## Registration

Calendar uses the generic extension registration path:

- `registerExtension("calendar", "v1")`

There is no extra calendar-specific native registration call in the SDK today.

## WAM Fit

Calendar is a good example of the server/WAM split:

- server functions return event types, slots, and booking state
- WAM uses `useCallFunction()` to drive the booking UI
- command, widget, or custom tab actions can open that WAM surface

## Reference

- [examples/calendar](../../examples/calendar/README.md)
