import { useEffect, useState, type CSSProperties } from "react";
import { useWamData, useWamSize, useCallFunction, useWamClose } from "@channel.io/app-sdk-wam";

interface CommandActionResponse {
  type: string;
  attributes?: {
    message?: string;
  };
}

interface Command {
  name: string;
  description: string;
}

interface GetCommandsResponse {
  commands: Command[];
}

export default function App() {
  const appId = useWamData<string>("appId") ?? "";
  const channelId = useWamData<string>("channelId");
  const { setSize } = useWamSize();
  const { close } = useWamClose();

  const [commandInput, setCommandInput] = useState("hello");
  const [argsInput, setArgsInput] = useState("world");
  const [availableCommands, setAvailableCommands] = useState<Command[]>([]);

  // Execute command
  const {
    call: executeCommand,
    loading: executing,
    data: executeResult,
    error: executeError,
  } = useCallFunction<CommandActionResponse>({
    appId,
    name: "extension.command.command.execute",
  });

  // Discover commands from metadata
  const { call: getCommands, loading: listing } = useCallFunction<GetCommandsResponse>({
    appId,
    name: "extension.command.metadata.getCommands",
  });

  useEffect(() => {
    setSize({ height: 400 });
  }, [setSize]);

  useEffect(() => {
    // Load available commands on mount
    void loadCommands();
  }, []);

  const loadCommands = async () => {
    try {
      const result = await getCommands({});
      setAvailableCommands(result.commands);
    } catch (error) {
      console.error("Failed to load commands:", error);
    }
  };

  const handleExecute = async () => {
    try {
      await executeCommand({
        chat: {
          type: "direct",
          id: channelId ?? "demo-chat",
        },
        trigger: {
          type: "wam-demo",
          attributes: {},
        },
        input: {
          command: commandInput,
          target: argsInput,
        },
        language: "en",
      });
    } catch (error) {
      console.error("Failed to execute command:", error);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Basic Example</h1>
        <button onClick={close} style={styles.closeButton}>
          ✕
        </button>
      </header>

      <div style={styles.info}>
        <p>
          <strong>Channel ID:</strong> {channelId ?? "N/A"}
        </p>
        <p>
          <strong>App ID:</strong> {appId.length > 0 ? appId : "N/A"}
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Execute Registered Command</h2>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Command</label>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            style={styles.input}
            placeholder="Enter command name"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Target</label>
          <input
            type="text"
            value={argsInput}
            onChange={(e) => setArgsInput(e.target.value)}
            style={styles.input}
            placeholder="Who to greet"
          />
        </div>

        <button
          onClick={() => {
            void handleExecute();
          }}
          disabled={executing || !commandInput}
          style={{
            ...styles.button,
            ...(executing ? styles.buttonDisabled : {}),
          }}
        >
          {executing ? "Executing..." : "Execute"}
        </button>

        {executeResult && (
          <div
            style={{
              ...styles.result,
              ...styles.resultSuccess,
            }}
          >
            <p>
              <strong>Action:</strong> {executeResult.type}
            </p>
            <p>
              <strong>Message:</strong> {executeResult.attributes?.message ?? "N/A"}
            </p>
          </div>
        )}

        {executeError && (
          <div style={{ ...styles.result, ...styles.resultError }}>
            <p>
              <strong>Error:</strong> {executeError.message}
            </p>
          </div>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Available Commands
          <button
            onClick={() => {
              void loadCommands();
            }}
            disabled={listing}
            style={styles.refreshButton}
          >
            {listing ? "..." : "↻"}
          </button>
        </h2>

        <ul style={styles.commandList}>
          {availableCommands.map((cmd) => (
            <li key={cmd.name} style={styles.commandItem} onClick={() => setCommandInput(cmd.name)}>
              <strong>{cmd.name}</strong>
              <span style={styles.commandDesc}>{cmd.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: 16,
    maxWidth: 400,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    margin: 0,
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    padding: 4,
  },
  info: {
    background: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    marginBottom: 4,
    color: "#666",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 14,
  },
  button: {
    width: "100%",
    padding: "10px 16px",
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  buttonDisabled: {
    background: "#ccc",
    cursor: "not-allowed",
  },
  refreshButton: {
    background: "none",
    border: "1px solid #ddd",
    borderRadius: 4,
    padding: "2px 8px",
    cursor: "pointer",
    fontSize: 12,
  },
  result: {
    marginTop: 12,
    padding: 12,
    borderRadius: 6,
    fontSize: 13,
  },
  resultSuccess: {
    background: "#d4edda",
    border: "1px solid #c3e6cb",
  },
  resultError: {
    background: "#f8d7da",
    border: "1px solid #f5c6cb",
  },
  commandList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  commandItem: {
    padding: "8px 12px",
    background: "#f9f9f9",
    borderRadius: 6,
    marginBottom: 6,
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commandDesc: {
    fontSize: 12,
    color: "#666",
  },
};
