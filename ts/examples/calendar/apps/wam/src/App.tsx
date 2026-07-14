import { useEffect, useState } from "react";
import { useWamData, useWamSize, useWamClose } from "@channel.io/app-sdk-wam";
import type { EventType, TimeSlot, Booking } from "@calendar-example/shared";
import { EventTypeList } from "./components/EventTypeList";
import { AvailabilityPicker } from "./components/AvailabilityPicker";
import { BookingForm } from "./components/BookingForm";
import { BookingConfirmation } from "./components/BookingConfirmation";

type Step = "select-event" | "select-time" | "enter-details" | "confirmation";

export default function App() {
  const appId = useWamData<string>("appId") ?? "";
  const { setSize } = useWamSize();
  const { close } = useWamClose();

  const [step, setStep] = useState<Step>("select-event");
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    setSize({ height: 500 });
  }, [setSize]);

  const handleEventTypeSelect = (eventType: EventType) => {
    setSelectedEventType(eventType);
    setStep("select-time");
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep("enter-details");
  };

  const handleBookingComplete = (newBooking: Booking) => {
    setBooking(newBooking);
    setStep("confirmation");
  };

  const handleBack = () => {
    switch (step) {
      case "select-time":
        setStep("select-event");
        setSelectedEventType(null);
        break;
      case "enter-details":
        setStep("select-time");
        setSelectedSlot(null);
        break;
      case "confirmation":
        setStep("select-event");
        setSelectedEventType(null);
        setSelectedSlot(null);
        setBooking(null);
        break;
    }
  };

  const getTitle = () => {
    switch (step) {
      case "select-event":
        return "Select Meeting Type";
      case "select-time":
        return "Choose a Time";
      case "enter-details":
        return "Your Details";
      case "confirmation":
        return "Booking Confirmed!";
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        {step !== "select-event" && step !== "confirmation" && (
          <button onClick={handleBack} style={styles.backButton}>
            ←
          </button>
        )}
        <h1 style={styles.title}>{getTitle()}</h1>
        <button onClick={close} style={styles.closeButton}>
          ✕
        </button>
      </header>

      <main style={styles.main}>
        {step === "select-event" && (
          <EventTypeList appId={appId} onSelect={handleEventTypeSelect} />
        )}

        {step === "select-time" && selectedEventType && (
          <AvailabilityPicker
            appId={appId}
            eventType={selectedEventType}
            onSelect={handleSlotSelect}
          />
        )}

        {step === "enter-details" && selectedEventType && selectedSlot && (
          <BookingForm
            appId={appId}
            eventType={selectedEventType}
            slot={selectedSlot}
            onComplete={handleBookingComplete}
          />
        )}

        {step === "confirmation" && booking && (
          <BookingConfirmation
            booking={booking}
            eventType={selectedEventType}
            onClose={close}
            onBookAnother={handleBack}
          />
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "white",
    minHeight: "100%",
  },
  header: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #eee",
    gap: 8,
  },
  backButton: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
    padding: 4,
  },
  main: {
    padding: 16,
  },
};
