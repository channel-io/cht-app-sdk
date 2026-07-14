package calendar

import (
	"github.com/channel-io/cht-app-sdk/go/appsdk"
	extensionkit "github.com/channel-io/cht-app-sdk/go/extension"
	"github.com/channel-io/cht-app-sdk/go/extension/schemaregistry"
	sdkv1 "github.com/channel-io/cht-app-sdk/go/internal/gen/channel/app/sdk/v1"
)

const (
	ExtensionName = "calendar"
	SystemVersion = "v1"

	FunctionListCalendars   = "extension.calendar.calendar.listCalendars"
	FunctionListEventTypes  = "extension.calendar.calendar.listEventTypes"
	FunctionGetAvailability = "extension.calendar.calendar.getAvailability"
	FunctionCreateBooking   = "extension.calendar.booking.createBooking"
	FunctionCancelBooking   = "extension.calendar.booking.cancelBooking"
	FunctionGetBooking      = "extension.calendar.bookingQuery.getBooking"
)

type ExtensionBuilder struct {
	base *extensionkit.Builder
}

func Extension() *ExtensionBuilder {
	return &ExtensionBuilder{base: extensionkit.New(ExtensionName, extensionkit.SystemVersion(SystemVersion))}
}

func (b *ExtensionBuilder) ListCalendars(handler appsdk.TypedHandlerFunc[ListCalendarsRequest, ListCalendarsResponse]) *ExtensionBuilder {
	b.base.Func(FunctionListCalendars, schemaregistry.Append(FunctionListCalendars, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) ListEventTypes(handler appsdk.TypedHandlerFunc[ListEventTypesRequest, ListEventTypesResponse]) *ExtensionBuilder {
	b.base.Func(FunctionListEventTypes, schemaregistry.Append(FunctionListEventTypes, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) GetAvailability(handler appsdk.TypedHandlerFunc[GetAvailabilityRequest, GetAvailabilityResponse]) *ExtensionBuilder {
	b.base.Func(FunctionGetAvailability, schemaregistry.Append(FunctionGetAvailability, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) CreateBooking(handler appsdk.TypedHandlerFunc[CreateBookingRequest, Booking]) *ExtensionBuilder {
	b.base.Func(FunctionCreateBooking, schemaregistry.Append(FunctionCreateBooking, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) CancelBooking(handler appsdk.TypedHandlerFunc[CancelBookingRequest, CancelBookingResponse]) *ExtensionBuilder {
	b.base.Func(FunctionCancelBooking, schemaregistry.Append(FunctionCancelBooking, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) GetBooking(handler appsdk.TypedHandlerFunc[GetBookingRequest, Booking]) *ExtensionBuilder {
	b.base.Func(FunctionGetBooking, schemaregistry.Append(FunctionGetBooking, appsdk.HandleProto(handler))...)
	return b
}

func (b *ExtensionBuilder) Function(name string, opts ...appsdk.FunctionOption) *ExtensionBuilder {
	b.base.Func(name, opts...)
	return b
}

func (b *ExtensionBuilder) ExtensionFunction(name string, opts ...appsdk.FunctionOption) *ExtensionBuilder {
	b.base.ExtensionFunc(name, opts...)
	return b
}

func (b *ExtensionBuilder) Register(app *appsdk.App) error {
	return b.base.Register(app)
}

type ListCalendarsRequest = sdkv1.CalendarListCalendarsInput
type ListCalendarsResponse = sdkv1.CalendarListCalendarsOutput
type ListEventTypesRequest = sdkv1.CalendarListEventTypesInput
type ListEventTypesResponse = sdkv1.CalendarListEventTypesOutput
type GetAvailabilityRequest = sdkv1.CalendarGetAvailabilityInput
type GetAvailabilityResponse = sdkv1.CalendarGetAvailabilityOutput
type CreateBookingRequest = sdkv1.CalendarCreateBookingInput
type CancelBookingRequest = sdkv1.CalendarCancelBookingInput
type CancelBookingResponse = sdkv1.CalendarCancelBookingOutput
type GetBookingRequest = sdkv1.CalendarGetBookingInput
type Calendar = sdkv1.Calendar
type EventType = sdkv1.CalendarEventType
type TimeSlot = sdkv1.CalendarTimeSlot
type Attendee = sdkv1.CalendarAttendee
type Booking = sdkv1.CalendarBooking
