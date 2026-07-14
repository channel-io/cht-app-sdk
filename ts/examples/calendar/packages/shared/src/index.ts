/**
 * Shared types for Calendar Example app
 */

export interface EventType {
  id: string;
  name: string;
  duration: number;
  description?: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface Attendee {
  name: string;
  email: string;
  phone?: string;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  startTime: string;
  endTime: string;
  attendee: Attendee;
  status: "confirmed" | "cancelled" | "pending";
  notes?: string;
}

export interface OAuthConfig {
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientId: string;
}
