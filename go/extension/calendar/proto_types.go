package calendar

import sdkv1 "github.com/channel-io/cht-app-sdk/go/internal/gen/channel/app/sdk/v1"

type ProtoCalendar = sdkv1.Calendar
type ProtoEventType = sdkv1.CalendarEventType
type ProtoTimeSlot = sdkv1.CalendarTimeSlot
type ProtoAttendee = sdkv1.CalendarAttendee
type ProtoBooking = sdkv1.CalendarBooking
type ProtoListCalendarsRequest = sdkv1.CalendarListCalendarsInput
type ProtoListCalendarsResponse = sdkv1.CalendarListCalendarsOutput
type ProtoListEventTypesRequest = sdkv1.CalendarListEventTypesInput
type ProtoListEventTypesResponse = sdkv1.CalendarListEventTypesOutput
type ProtoGetAvailabilityRequest = sdkv1.CalendarGetAvailabilityInput
type ProtoGetAvailabilityResponse = sdkv1.CalendarGetAvailabilityOutput
type ProtoCreateBookingRequest = sdkv1.CalendarCreateBookingInput
type ProtoCancelBookingRequest = sdkv1.CalendarCancelBookingInput
type ProtoCancelBookingResponse = sdkv1.CalendarCancelBookingOutput
type ProtoGetBookingRequest = sdkv1.CalendarGetBookingInput
