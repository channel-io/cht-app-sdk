import { useCallback } from "react";
import type { WamSize } from "../types/wam.js";

/**
 * Hook for controlling WAM window size
 *
 * @returns Object with setSize function
 *
 * @example
 * ```typescript
 * function MyWidget() {
 *   const { setSize } = useWamSize();
 *
 *   useEffect(() => {
 *     setSize({ height: 400 });
 *   }, [setSize]);
 *
 *   const expand = () => setSize({ height: 600, width: 500 });
 *
 *   return <button onClick={expand}>Expand</button>;
 * }
 * ```
 */
export function useWamSize() {
  const setSize = useCallback((size: WamSize) => {
    if (typeof window === "undefined") {
      return;
    }

    const wam = window.ChannelIOWam;
    if (!wam || typeof wam.setSize !== "function") {
      console.warn("ChannelIOWam.setSize is not available");
      return;
    }

    wam.setSize(size);
  }, []);

  return { setSize };
}

/**
 * Hook for closing WAM window
 *
 * @returns Object with close function
 *
 * @example
 * ```typescript
 * function MyWidget() {
 *   const { close } = useWamClose();
 *
 *   return <button onClick={close}>Close</button>;
 * }
 * ```
 */
export function useWamClose() {
  const close = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const wam = window.ChannelIOWam;
    if (!wam || typeof wam.close !== "function") {
      console.warn("ChannelIOWam.close is not available");
      return;
    }

    wam.close();
  }, []);

  return { close };
}
