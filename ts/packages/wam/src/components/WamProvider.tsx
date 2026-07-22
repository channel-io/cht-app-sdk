import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  type ReactNode,
  useMemo,
} from "react";
import { getWamCanvasColor, getWamCanvasTheme, synchronizeWamCanvas } from "../utils/wamCanvas.js";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * WAM context value
 */
export interface WamContextValue {
  /** Whether WAM APIs are available */
  isAvailable: boolean;
}

const WamContext = createContext<WamContextValue | null>(null);

/**
 * Props for WamProvider component
 */
export interface WamProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps your WAM app
 *
 * @example
 * ```typescript
 * function App() {
 *   return (
 *     <WamProvider>
 *       <MyWidget />
 *     </WamProvider>
 *   );
 * }
 * ```
 */
export function WamProvider({ children }: WamProviderProps) {
  const value = useMemo<WamContextValue>(() => {
    const isAvailable = typeof window !== "undefined" && window.ChannelIOWam !== undefined;

    return { isAvailable };
  }, []);

  useIsomorphicLayoutEffect(() => {
    const theme = getWamCanvasTheme();
    return synchronizeWamCanvas(theme, getWamCanvasColor(theme), 0);
  }, []);

  return <WamContext.Provider value={value}>{children}</WamContext.Provider>;
}

/**
 * Hook to access WAM context
 *
 * @returns WAM context value
 * @throws Error if used outside of WamProvider
 *
 * @example
 * ```typescript
 * function MyWidget() {
 *   const { isAvailable } = useWamContext();
 *
 *   if (!isAvailable) {
 *     return <div>WAM not available</div>;
 *   }
 *
 *   return <div>WAM is ready</div>;
 * }
 * ```
 */
export function useWamContext(): WamContextValue {
  const context = useContext(WamContext);

  if (!context) {
    throw new Error("useWamContext must be used within a WamProvider");
  }

  return context;
}
