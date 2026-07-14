import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WamThemeProvider } from "../providers/WamThemeProvider.js";
import { WamHeader } from "../components/WamHeader.js";

function renderWithTheme(ui: React.ReactElement) {
  return render(<WamThemeProvider>{ui}</WamThemeProvider>);
}

describe("WamHeader", () => {
  it("renders the title", () => {
    renderWithTheme(<WamHeader title="My App" />);
    expect(screen.getByText("My App")).toBeInTheDocument();
  });

  it("shows close button by default", () => {
    renderWithTheme(<WamHeader title="My App" />);
    expect(screen.getByRole("button", { name: "close" })).toBeInTheDocument();
  });

  it("hides close button when showCloseButton=false", () => {
    renderWithTheme(<WamHeader title="My App" showCloseButton={false} />);
    expect(screen.queryByRole("button", { name: "close" })).not.toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    renderWithTheme(<WamHeader title="My App" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls window.ChannelIOWam.close() when no onClose provided", () => {
    const mockClose = vi.fn();
    (window as unknown as Record<string, unknown>).ChannelIOWam = { close: mockClose };

    renderWithTheme(<WamHeader title="My App" />);
    fireEvent.click(screen.getByRole("button", { name: "close" }));
    expect(mockClose).toHaveBeenCalled();

    delete (window as unknown as Record<string, unknown>).ChannelIOWam;
  });

  it("does not show back button by default", () => {
    renderWithTheme(<WamHeader title="My App" />);
    expect(screen.queryByRole("button", { name: "back" })).not.toBeInTheDocument();
  });

  it("shows back button when showBackButton=true", () => {
    renderWithTheme(<WamHeader title="My App" showBackButton />);
    expect(screen.getByRole("button", { name: "back" })).toBeInTheDocument();
  });

  it("calls onBack when back button clicked", () => {
    const onBack = vi.fn();
    renderWithTheme(<WamHeader title="My App" showBackButton onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "back" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("calls history.back() when no onBack provided", () => {
    const historyBack = vi.spyOn(history, "back").mockImplementation(() => {});
    renderWithTheme(<WamHeader title="My App" showBackButton />);
    fireEvent.click(screen.getByRole("button", { name: "back" }));
    expect(historyBack).toHaveBeenCalled();
    historyBack.mockRestore();
  });

  it("renders rightContent", () => {
    renderWithTheme(
      <WamHeader title="My App" rightContent={<button data-testid="action">Settings</button>} />
    );
    expect(screen.getByTestId("action")).toBeInTheDocument();
  });
});
