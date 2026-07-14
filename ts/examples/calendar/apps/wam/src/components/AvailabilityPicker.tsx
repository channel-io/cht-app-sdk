import { useEffect, useState } from "react";
import { useCallFunction } from "@channel.io/app-sdk-wam";
import type { EventType, TimeSlot } from "@calendar-example/shared";

interface Props {
  appId: string;
  eventType: EventType;
  onSelect: (slot: TimeSlot) => void;
}

export function AvailabilityPicker({ appId, eventType, onSelect }: Props) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const { call, loading } = useCallFunction<{ slots: TimeSlot[] }>({
    appId,
    name: "calendar.calendar.getAvailability",
  });

  useEffect(() => {
    loadAvailability();
  }, [selectedDate]);

  const loadAvailability = async () => {
    try {
      const startDate = new Date(selectedDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const result = await call({
        eventTypeId: eventType.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      setSlots(result.slots);
    } catch (e) {
      console.error("Failed to load availability:", e);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Group slots by date
  const slotsByDate = slots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    const date = slot.startTime.split("T")[0]!;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {});

  return (
    <div style={styles.container}>
      <div style={styles.eventInfo}>
        <strong>{eventType.name}</strong>
        <span style={styles.duration}>{eventType.duration} min</span>
      </div>

      <div style={styles.dateNav}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={styles.dateInput}
        />
      </div>

      {loading ? (
        <div style={styles.loading}>Loading available times...</div>
      ) : (
        <div style={styles.slotsContainer}>
          {Object.entries(slotsByDate).length === 0 ? (
            <div style={styles.noSlots}>No available times for this period</div>
          ) : (
            Object.entries(slotsByDate).map(([date, dateSlots]) => (
              <div key={date} style={styles.dateGroup}>
                <div style={styles.dateHeader}>{formatDate(dateSlots[0]!.startTime)}</div>
                <div style={styles.timeSlots}>
                  {dateSlots.map((slot) => (
                    <button
                      key={slot.startTime}
                      onClick={() => {
                        onSelect(slot);
                      }}
                      style={styles.slotButton}
                    >
                      {formatTime(slot.startTime)}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  eventInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    background: "#f8f9fa",
    borderRadius: 8,
  },
  duration: {
    fontSize: 14,
    color: "#007bff",
  },
  dateNav: {
    display: "flex",
    gap: 8,
  },
  dateInput: {
    flex: 1,
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 14,
  },
  loading: {
    textAlign: "center",
    padding: 20,
    color: "#666",
  },
  slotsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    maxHeight: 300,
    overflow: "auto",
  },
  noSlots: {
    textAlign: "center",
    padding: 20,
    color: "#666",
  },
  dateGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: 600,
    color: "#333",
  },
  timeSlots: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  slotButton: {
    padding: "8px 16px",
    border: "1px solid #007bff",
    borderRadius: 6,
    background: "white",
    color: "#007bff",
    cursor: "pointer",
    fontSize: 13,
  },
};
