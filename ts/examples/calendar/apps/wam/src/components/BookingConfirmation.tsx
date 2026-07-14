import type { EventType, Booking } from "@calendar-example/shared";

interface Props {
  booking: Booking;
  eventType: EventType;
  onClose: () => void;
  onBookAnother: () => void;
}

export function BookingConfirmation({ booking, eventType, onClose, onBookAnother }: Props) {
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

  return (
    <div style={styles.container}>
      <div style={styles.iconContainer}>
        <div style={styles.successIcon}>✓</div>
      </div>

      <h2 style={styles.title}>Booking Confirmed!</h2>
      <p style={styles.subtitle}>Your meeting has been scheduled successfully.</p>

      <div style={styles.details}>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Meeting</span>
          <span style={styles.detailValue}>{eventType.name}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Duration</span>
          <span style={styles.detailValue}>{eventType.duration} minutes</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Date & Time</span>
          <span style={styles.detailValue}>{formatDateTime(booking.startTime)}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Attendee</span>
          <span style={styles.detailValue}>{booking.attendee.name}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Email</span>
          <span style={styles.detailValue}>{booking.attendee.email}</span>
        </div>
        {booking.attendee.phone && (
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Phone</span>
            <span style={styles.detailValue}>{booking.attendee.phone}</span>
          </div>
        )}
        {booking.notes && (
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Notes</span>
            <span style={styles.detailValue}>{booking.notes}</span>
          </div>
        )}
      </div>

      <div style={styles.bookingId}>
        <span style={styles.bookingIdLabel}>Booking ID:</span>
        <code style={styles.bookingIdValue}>{booking.id}</code>
      </div>

      <div style={styles.actions}>
        <button onClick={onBookAnother} style={styles.secondaryButton}>
          Book Another
        </button>
        <button onClick={onClose} style={styles.primaryButton}>
          Done
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: 16,
  },
  iconContainer: {
    marginBottom: 16,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "#28a745",
    color: "white",
    fontSize: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: "#333",
  },
  subtitle: {
    margin: "8px 0 24px",
    fontSize: 14,
    color: "#666",
  },
  details: {
    width: "100%",
    background: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "8px 0",
    borderBottom: "1px solid #eee",
  },
  detailLabel: {
    fontSize: 13,
    color: "#666",
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: 500,
    color: "#333",
    textAlign: "right",
    marginLeft: 16,
  },
  bookingId: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
    fontSize: 12,
    color: "#666",
  },
  bookingIdLabel: {
    fontWeight: 500,
  },
  bookingIdValue: {
    background: "#eee",
    padding: "2px 6px",
    borderRadius: 4,
    fontFamily: "monospace",
  },
  actions: {
    display: "flex",
    gap: 12,
    width: "100%",
  },
  primaryButton: {
    flex: 1,
    padding: "12px 16px",
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  secondaryButton: {
    flex: 1,
    padding: "12px 16px",
    background: "white",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
};
