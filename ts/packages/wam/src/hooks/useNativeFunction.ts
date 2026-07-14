import { useState, useCallback } from "react";

/**
 * Options for useNativeFunction hook
 */
export interface UseNativeFunctionOptions {
  /** Native function name */
  name: string;
}

/**
 * Result of useNativeFunction hook
 */
export interface UseNativeFunctionResult<T> {
  /** Function to call the native function */
  call: (params: Record<string, unknown>) => Promise<T>;
  /** Whether the function is currently being called */
  loading: boolean;
  /** Error from the last call, if any */
  error: Error | null;
  /** Data from the last successful call */
  data: T | null;
  /** Reset the state */
  reset: () => void;
}

/**
 * Hook for calling Channel.io native functions from WAM
 *
 * @param options - Native function call options
 * @returns Object with call function and state
 *
 * @example
 * ```typescript
 * function MessageWidget() {
 *   const { call, loading } = useNativeFunction<void>({
 *     name: 'sendMessage',
 *   });
 *
 *   const handleSend = async () => {
 *     await call({
 *       channelId: '...',
 *       groupId: '...',
 *       content: 'Hello from WAM!',
 *     });
 *   };
 *
 *   return (
 *     <button onClick={handleSend} disabled={loading}>
 *       Send Message
 *     </button>
 *   );
 * }
 * ```
 */
export function useNativeFunction<T = unknown>(
  options: UseNativeFunctionOptions
): UseNativeFunctionResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const call = useCallback(
    async (params: Record<string, unknown>): Promise<T> => {
      if (typeof window === "undefined") {
        throw new Error("Window is not available");
      }

      const wam = window.ChannelIOWam;
      if (!wam || typeof wam.callNativeFunction !== "function") {
        throw new Error("ChannelIOWam.callNativeFunction is not available");
      }

      setLoading(true);
      setError(null);

      try {
        const result = await wam.callNativeFunction<T>({
          name: options.name,
          params,
        });
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options.name]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { call, loading, error, data, reset };
}
