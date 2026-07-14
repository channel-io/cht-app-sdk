import { useEffect, useState } from "react";
import { useCallFunction } from "@channel.io/app-sdk-wam";
import type { EventType } from "@calendar-example/shared";

interface Props {
  appId: string;
  onSelect: (eventType: EventType) => void;
}

export function EventTypeList({ appId, onSelect }: Props) {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);

  const { call, loading, error } = useCallFunction<{ eventTypes: EventType[] }>({
    appId,
    name: "calendar.calendar.listEventTypes",
  });

  useEffect(() => {
    loadEventTypes();
  }, []);

  const loadEventTypes = async () => {
    try {
      const result = await call({});
      setEventTypes(result.eventTypes);
    } catch (e) {
      console.error("Failed to load event types:", e);
    }
  };

  if (loading && eventTypes.length === 0) {
    return <div style={styles.loading}>Loading event types...</div>;
  }

  if (error) {
    return (
      <div style={styles.error}>
        <p>Failed to load event types</p>
        <button onClick={loadEventTypes} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {eventTypes.map((eventType) => (
        <button
          key={eventType.id}
          onClick={() => {
            onSelect(eventType);
          }}
          style={styles.eventTypeCard}
        >
          <div style={styles.eventTypeName}>{eventType.name}</div>
          <div style={styles.eventTypeDuration}>{eventType.duration} min</div>
          {eventType.description && (
            <div style={styles.eventTypeDescription}>{eventType.description}</div>
          )}
        </button>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  loading: {
    textAlign: "center",
    padding: 20,
    color: "#666",
  },
  error: {
    textAlign: "center",
    padding: 20,
    color: "#dc3545",
  },
  retryButton: {
    marginTop: 8,
    padding: "8px 16px",
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  eventTypeCard: {
    padding: 16,
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    background: "white",
    cursor: "pointer",
    textAlign: "left",
    transition: "border-color 0.2s",
  },
  eventTypeName: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 4,
  },
  eventTypeDuration: {
    fontSize: 14,
    color: "#007bff",
    marginBottom: 8,
  },
  eventTypeDescription: {
    fontSize: 13,
    color: "#666",
  },
};
