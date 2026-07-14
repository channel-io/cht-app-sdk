package calendar_test

import (
	"context"
	"testing"

	"github.com/channel-io/cht-app-sdk/go/appsdk"
	"github.com/channel-io/cht-app-sdk/go/extension/calendar"
	"google.golang.org/protobuf/encoding/protojson"
)

func TestExtensionRegistersCalendarHandlers(t *testing.T) {
	app := appsdk.New(appsdk.Options{AppID: "app"})
	if err := app.Use(calendar.Extension().
		ListCalendars(func(context.Context, appsdk.Context, *calendar.ListCalendarsRequest) (*calendar.ListCalendarsResponse, error) {
			return &calendar.ListCalendarsResponse{Calendars: []*calendar.Calendar{{Id: "cal-1", Name: "Sales"}}}, nil
		}).
		GetAvailability(func(context.Context, appsdk.Context, *calendar.GetAvailabilityRequest) (*calendar.GetAvailabilityResponse, error) {
			return &calendar.GetAvailabilityResponse{Slots: []*calendar.TimeSlot{{StartTime: "2026-06-24T01:00:00Z", EndTime: "2026-06-24T01:30:00Z"}}}, nil
		}),
	); err != nil {
		t.Fatal(err)
	}

	if !app.HasMethod(calendar.FunctionListCalendars) || !app.HasMethod(calendar.FunctionGetAvailability) {
		t.Fatalf("unexpected methods: %v", app.Methods())
	}

	res := app.HandleRequest(context.Background(), appsdk.FunctionRequest{Method: calendar.FunctionListCalendars})
	if res.Error != nil {
		t.Fatalf("unexpected error: %+v", res.Error)
	}
	var out calendar.ListCalendarsResponse
	if err := protojson.Unmarshal(res.Result, &out); err != nil {
		t.Fatal(err)
	}
	if len(out.Calendars) != 1 || out.Calendars[0].GetId() != "cal-1" {
		t.Fatalf("unexpected calendars: %+v", out.Calendars)
	}
}
