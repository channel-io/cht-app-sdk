import { type PropsWithChildren, useEffect, useLayoutEffect, useMemo } from "react";
import { AppProvider, type ThemeName, ToastProvider } from "@channel.io/bezier-react";
import {
  getWamCanvasColor,
  getWamCanvasTheme,
  synchronizeWamCanvas,
  type WamCanvasTheme,
} from "../utils/wamCanvas.js";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface WamThemeProviderProps extends PropsWithChildren {
  /** Override theme. If omitted, reads from window.ChannelIOWam */
  theme?: ThemeName;
}

function getWamAppearance(): ThemeName {
  return getWamCanvasTheme();
}

export function WamThemeProvider({ children, theme }: WamThemeProviderProps) {
  const detectedTheme = useMemo(() => getWamAppearance(), []);
  const themeName = theme ?? detectedTheme;
  const canvasTheme: WamCanvasTheme = themeName === "dark" ? "dark" : "light";

  useIsomorphicLayoutEffect(() => {
    return synchronizeWamCanvas(canvasTheme, getWamCanvasColor(canvasTheme), 1);
  }, [canvasTheme]);

  return (
    <AppProvider themeName={themeName}>
      <ToastProvider>{children}</ToastProvider>
    </AppProvider>
  );
}
