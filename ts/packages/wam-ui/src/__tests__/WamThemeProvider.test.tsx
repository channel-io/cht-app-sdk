import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WamThemeProvider } from "../providers/WamThemeProvider.js";

// Spy on AppProvider to capture the themeName prop
const appProviderTheme = vi.fn();
vi.mock("@channel.io/bezier-react", async () => {
  const actual = await vi.importActual<typeof import("@channel.io/bezier-react")>(
    "@channel.io/bezier-react"
  );
  return {
    ...actual,
    AppProvider: ({ themeName, children }: { themeName: string; children: React.ReactNode }) => {
      appProviderTheme(themeName);
      return <div data-theme={themeName}>{children}</div>;
    },
    ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe("WamThemeProvider", () => {
  beforeEach(() => {
    appProviderTheme.mockClear();
  });

  it("renders children", () => {
    render(
      <WamThemeProvider>
        <span data-testid="child">hello</span>
      </WamThemeProvider>
    );
    expect(screen.getByTestId("child")).toHaveTextContent("hello");
  });

  it("defaults to light theme when ChannelIOWam is not available", () => {
    render(
      <WamThemeProvider>
        <span>content</span>
      </WamThemeProvider>
    );
    expect(appProviderTheme).toHaveBeenCalledWith("light");
    expect([
      document.documentElement.style.backgroundColor,
      document.body.style.backgroundColor,
      document.documentElement.style.colorScheme,
      document.body.style.colorScheme,
    ]).toEqual(["rgb(254, 255, 255)", "rgb(254, 255, 255)", "light", "light"]);
  });

  it("reads dark theme from WAM context", () => {
    window.ChannelIOWam = {
      getWamData: vi.fn((key: string) => (key === "appearance" ? "dark" : null)),
      setSize: vi.fn(),
      callFunction: vi.fn(),
      callNativeFunction: vi.fn(),
      close: vi.fn(),
    };

    render(
      <WamThemeProvider>
        <span>content</span>
      </WamThemeProvider>
    );
    expect(appProviderTheme).toHaveBeenCalledWith("dark");
    expect([
      document.documentElement.style.backgroundColor,
      document.body.style.backgroundColor,
      document.documentElement.style.colorScheme,
      document.body.style.colorScheme,
    ]).toEqual(["rgb(28, 28, 31)", "rgb(28, 28, 31)", "dark", "dark"]);
  });

  it("uses explicit theme prop over WAM context", () => {
    window.ChannelIOWam = {
      getWamData: vi.fn((key: string) => (key === "appearance" ? "dark" : null)),
      setSize: vi.fn(),
      callFunction: vi.fn(),
      callNativeFunction: vi.fn(),
      close: vi.fn(),
    };

    render(
      <WamThemeProvider theme="light">
        <span>content</span>
      </WamThemeProvider>
    );
    expect(appProviderTheme).toHaveBeenCalledWith("light");
    expect(document.body.style.backgroundColor).toBe("rgb(254, 255, 255)");
  });

  it("reacts to theme prop changes", () => {
    const { rerender } = render(
      <WamThemeProvider theme="light">
        <span>content</span>
      </WamThemeProvider>
    );
    expect(appProviderTheme).toHaveBeenLastCalledWith("light");

    rerender(
      <WamThemeProvider theme="dark">
        <span>content</span>
      </WamThemeProvider>
    );
    expect(appProviderTheme).toHaveBeenLastCalledWith("dark");
    expect(document.body.style.backgroundColor).toBe("rgb(28, 28, 31)");
  });
});
