import type { Context } from "../../types/context.js";
import type {
  CalendarBooking as Booking,
  CalendarCancelBookingInput as ProtoCancelBookingInput,
  CalendarCancelBookingOutput as ProtoCancelBookingOutput,
  CalendarCreateBookingInput as ProtoCreateBookingInput,
  CalendarGetAvailabilityInput as ProtoGetAvailabilityInput,
  CalendarGetAvailabilityOutput as ProtoGetAvailabilityOutput,
  CalendarGetBookingInput as ProtoGetBookingInput,
  CalendarListCalendarsInput as ProtoListCalendarsInput,
  CalendarListCalendarsOutput as ProtoListCalendarsOutput,
  CalendarListEventTypesInput as ProtoListEventTypesInput,
  CalendarListEventTypesOutput as ProtoListEventTypesOutput,
} from "../../gen/channel/app/sdk/v1/extension.js";

/**
 * Calendar Extension Input Types
 */
export type ListCalendarsInput = ProtoListCalendarsInput;
export type ListCalendarsOutput = ProtoListCalendarsOutput;
export type ListEventTypesInput = ProtoListEventTypesInput;
export type ListEventTypesOutput = ProtoListEventTypesOutput;
export type GetAvailabilityInput = ProtoGetAvailabilityInput;
export type GetAvailabilityOutput = ProtoGetAvailabilityOutput;
export type CreateBookingInput = ProtoCreateBookingInput;
export type CancelBookingInput = ProtoCancelBookingInput;
export type CancelBookingOutput = ProtoCancelBookingOutput;
export type GetBookingInput = ProtoGetBookingInput;

/**
 * Calendar Extension Interface
 *
 * Implement this interface to create a calendar/scheduling extension.
 *
 * @example
 * ```typescript
 * @Extension({ name: "calendar", systemVersion: "v1" })
 * export class MyCalendarExtension implements CalendarExtensionInterface {
 *   @Func("calendar.listCalendars")
 *   async listCalendars(ctx, params): Promise<ListCalendarsOutput> {
 *     return { calendars: [...] };
 *   }
 *
 *   @Func("calendar.listEventTypes")
 *   async listEventTypes(ctx, params): Promise<ListEventTypesOutput> {
 *     return { eventTypes: [...] };
 *   }
 *
 *   @Func("calendar.getAvailability")
 *   async getAvailability(ctx, params): Promise<GetAvailabilityOutput> {
 *     return { slots: [...] };
 *   }
 *
 *   @Func("calendar.createBooking")
 *   async createBooking(ctx, params): Promise<Booking> {
 *     return { id: "...", ... };
 *   }
 *
 *   @Func("calendar.cancelBooking")
 *   async cancelBooking(ctx, params): Promise<CancelBookingOutput> {
 *     return { success: true };
 *   }
 *
 *   @Func("calendar.getBooking")
 *   async getBooking(ctx, params): Promise<Booking> {
 *     return { id: "...", ... };
 *   }
 * }
 * ```
 */
export interface CalendarExtensionInterface {
  /**
   * List available calendars
   *
   * Function name: "calendar.listCalendars"
   */
  listCalendars(ctx: Context, params: ListCalendarsInput): Promise<ListCalendarsOutput>;

  /**
   * List event types (meeting types)
   *
   * Function name: "calendar.listEventTypes"
   */
  listEventTypes(ctx: Context, params: ListEventTypesInput): Promise<ListEventTypesOutput>;

  /**
   * Get available time slots for booking
   *
   * Function name: "calendar.getAvailability"
   */
  getAvailability(ctx: Context, params: GetAvailabilityInput): Promise<GetAvailabilityOutput>;

  /**
   * Create a new booking
   *
   * Function name: "calendar.createBooking"
   */
  createBooking(ctx: Context, params: CreateBookingInput): Promise<Booking>;

  /**
   * Cancel an existing booking
   *
   * Function name: "calendar.cancelBooking"
   */
  cancelBooking(ctx: Context, params: CancelBookingInput): Promise<CancelBookingOutput>;

  /**
   * Get booking details
   *
   * Function name: "calendar.getBooking"
   */
  getBooking(ctx: Context, params: GetBookingInput): Promise<Booking>;
}

/**
 * Calendar Extension Function Names
 */
export const CalendarFunctionNames = {
  listCalendars: "calendar.listCalendars",
  listEventTypes: "calendar.listEventTypes",
  getAvailability: "calendar.getAvailability",
  createBooking: "calendar.createBooking",
  cancelBooking: "calendar.cancelBooking",
  getBooking: "calendar.getBooking",
} as const;
