import { useState } from "react";
import { useCallFunction } from "@channel.io/app-sdk-wam";
import type { EventType, TimeSlot, Booking } from "@calendar-example/shared";

interface Props {
  appId: string;
  eventType: EventType;
  slot: TimeSlot;
  onComplete: (booking: Booking) => void;
}

export function BookingForm({ appId, eventType, slot, onComplete }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const { call, loading, error } = useCallFunction<{ booking: Booking }>({
    appId,
    name: "calendar.booking.createBooking",
  });

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await call({
        eventTypeId: eventType.id,
        startTime: slot.startTime,
        attendee: {
          name,
          email,
          ...(phone ? { phone } : {}),
        },
        ...(notes ? { notes } : {}),
      });

      onComplete(result.booking);
    } catch (e) {
      console.error("Failed to create booking:", e);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.summary}>
        <div style={styles.summaryItem}>
          <strong>{eventType.name}</strong>
          <span>{eventType.duration} min</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.dateTime}>{formatDateTime(slot.startTime)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={styles.input}
            placeholder="Your name"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            placeholder="your@email.com"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={styles.input}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={styles.textarea}
            placeholder="Any additional information..."
            rows={3}
          />
        </div>

        {error && <div style={styles.error}>{error.message}</div>}

        <button
          type="submit"
          disabled={loading || !name || !email}
          style={{
            ...styles.submitButton,
            ...(loading ? styles.submitButtonDisabled : {}),
          }}
        >
          {loading ? "Booking..." : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  summary: {
    padding: 12,
    background: "#f8f9fa",
    borderRadius: 8,
  },
  summaryItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  dateTime: {
    color: "#007bff",
    fontSize: 14,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: "#333",
  },
  input: {
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 14,
  },
  textarea: {
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 14,
    resize: "vertical",
  },
  error: {
    padding: 12,
    background: "#f8d7da",
    border: "1px solid #f5c6cb",
    borderRadius: 6,
    color: "#721c24",
    fontSize: 13,
  },
  submitButton: {
    padding: "12px 16px",
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    marginTop: 8,
  },
  submitButtonDisabled: {
    background: "#ccc",
    cursor: "not-allowed",
  },
};
