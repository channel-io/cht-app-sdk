import { useMemo } from "react";

/**
 * Get WAM data by key
 *
 * @param key - The key to retrieve from WAM data
 * @returns The value associated with the key, or undefined if not found
 *
 * @example
 * ```typescript
 * function MyWidget() {
 *   const appId = useWamData('appId');
 *   const channelId = useWamData('channelId');
 *   const customData = useWamData('myCustomKey');
 *
 *   return <div>App: {appId}</div>;
 * }
 * ```
 */
export function useWamData(key: string): unknown {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const wam = window.ChannelIOWam;
    if (!wam || typeof wam.getWamData !== "function") {
      console.warn("ChannelIOWam.getWamData is not available");
      return undefined;
    }

    return wam.getWamData(key);
  }, [key]);
}

/**
 * Common WAM data keys
 */
export type WamDataKey =
  | "appId"
  | "channelId"
  | "managerId"
  | "chatId"
  | "chatType"
  | "chatTitle"
  | "rootMessageId"
  | "broadcast"
  | "isPrivate"
  | (string & {});

/**
 * Get typed WAM data for common keys
 *
 * @example
 * ```typescript
 * function MyWidget() {
 *   const appId = useTypedWamData('appId'); // string | undefined
 *   const channelId = useTypedWamData('channelId'); // string | undefined
 * }
 * ```
 */
export function useTypedWamData(
  key: "appId" | "channelId" | "managerId" | "chatId" | "chatType" | "chatTitle" | "rootMessageId"
): string | undefined;
export function useTypedWamData(key: "broadcast" | "isPrivate"): boolean | undefined;
export function useTypedWamData(key: string): unknown;
export function useTypedWamData(key: WamDataKey): unknown {
  return useWamData(key);
}
