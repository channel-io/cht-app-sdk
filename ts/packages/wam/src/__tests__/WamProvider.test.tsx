import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WamProvider } from "../components/WamProvider.js";

function installAppearance(appearance: "light" | "dark") {
  window.ChannelIOWam = {
    getWamData: vi.fn((key: string) => (key === "appearance" ? appearance : null)),
    setSize: vi.fn(),
    callFunction: vi.fn(),
    callNativeFunction: vi.fn(),
    close: vi.fn(),
  };
}

describe("WamProvider", () => {
  it.each([
    ["light", "rgb(254, 255, 255)"],
    ["dark", "rgb(28, 28, 31)"],
  ] as const)("applies the %s canvas", (appearance, color) => {
    installAppearance(appearance);

    render(
      <WamProvider>
        <span>content</span>
      </WamProvider>
    );

    expect([
      document.documentElement.style.backgroundColor,
      document.body.style.backgroundColor,
      document.documentElement.style.colorScheme,
      document.body.style.colorScheme,
    ]).toEqual([color, color, appearance, appearance]);
  });
});
