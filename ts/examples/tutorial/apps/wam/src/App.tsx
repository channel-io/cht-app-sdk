import { useEffect, useState, type CSSProperties } from "react";
import { useWamData, useWamSize, useCallFunction, useWamClose } from "@channel.io/app-sdk-wam";

interface SendMessageResponse {
  success: boolean;
  messageId?: string;
}

export default function App() {
  const appId = useWamData<string>("appId") ?? "";
  const userChatId = useWamData<string>("userChatId") ?? "";
  const { setSize } = useWamSize();
  const { close } = useWamClose();
  const [lastSender, setLastSender] = useState<"manager" | "bot" | null>(null);

  const {
    call: sendMessage,
    loading: sending,
    data: sendResult,
    error: sendError,
  } = useCallFunction<SendMessageResponse>({
    appId,
    name: "extension.command.message.send",
  });

  useEffect(() => {
    setSize({ height: 240 });
  }, [setSize]);

  const handleSend = async (senderType: "manager" | "bot") => {
    setLastSender(senderType);
    try {
      await sendMessage({ userChatId, senderType });
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const isDisabled = sending || !userChatId;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Tutorial</h1>
        <button onClick={close} style={styles.closeButton}>✕</button>
      </header>

      <p style={styles.description}>현재 상담에 테스트 메시지를 전송합니다.</p>

      <div style={styles.buttons}>
        <button
          onClick={() => { void handleSend("manager"); }}
          disabled={isDisabled}
          style={{
            ...styles.button,
            ...styles.managerButton,
            ...(isDisabled ? styles.buttonDisabled : {}),
          }}
        >
          {sending && lastSender === "manager" ? "전송 중..." : "매니저로 보내기"}
        </button>

        <button
          onClick={() => { void handleSend("bot"); }}
          disabled={isDisabled}
          style={{
            ...styles.button,
            ...styles.botButton,
            ...(isDisabled ? styles.buttonDisabled : {}),
          }}
        >
          {sending && lastSender === "bot" ? "전송 중..." : "봇으로 보내기"}
        </button>
      </div>

      {sendResult?.success && (
        <div style={{ ...styles.feedback, ...styles.feedbackSuccess }}>
          ✅ 메시지가 전송되었습니다.
        </div>
      )}
      {sendError && (
        <div style={{ ...styles.feedback, ...styles.feedbackError }}>
          ❌ 오류: {sendError.message}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: 20,
    maxWidth: 360,
    margin: "0 auto",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
    padding: 4,
    color: "#666",
  },
  description: {
    fontSize: 13,
    color: "#666",
    margin: "0 0 20px",
  },
  buttons: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  button: {
    padding: "12px 16px",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  managerButton: {
    background: "#007bff",
    color: "#fff",
  },
  botButton: {
    background: "#6c757d",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  feedback: {
    marginTop: 14,
    padding: "10px 14px",
    borderRadius: 6,
    fontSize: 13,
  },
  feedbackSuccess: {
    background: "#d4edda",
    color: "#155724",
    border: "1px solid #c3e6cb",
  },
  feedbackError: {
    background: "#f8d7da",
    color: "#721c24",
    border: "1px solid #f5c6cb",
  },
};
