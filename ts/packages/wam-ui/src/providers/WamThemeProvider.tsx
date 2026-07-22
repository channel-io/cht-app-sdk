import { type PropsWithChildren, useMemo } from "react";
import { AppProvider, type ThemeName } from "@channel.io/bezier-react";
import { ToastProvider } from "@channel.io/bezier-react/beta";

export interface WamThemeProviderProps extends PropsWithChildren {
  /** Override theme. If omitted, reads from window.ChannelIOWam */
  theme?: ThemeName;
}

function getWamAppearance(): ThemeName {
  try {
    const wam = window.ChannelIOWam;
    if (wam != null && typeof wam.getWamData === "function") {
      const appearance = wam.getWamData("appearance");
      if (appearance === "dark") return "dark";
    }
  } catch {
    // ignore — not in WAM context
  }
  return "light";
}

export function WamThemeProvider({ children, theme }: WamThemeProviderProps) {
  const detectedTheme = useMemo(() => getWamAppearance(), []);
  const themeName = theme ?? detectedTheme;

  return (
    <AppProvider themeName={themeName}>
      <ToastProvider>{children}</ToastProvider>
    </AppProvider>
  );
}
