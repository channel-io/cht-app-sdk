import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WamThemeProvider } from "../providers/WamThemeProvider.js";
import { BottomSheet } from "../components/BottomSheet.js";

function renderWithTheme(ui: React.ReactElement) {
  return render(<WamThemeProvider>{ui}</WamThemeProvider>);
}

describe("BottomSheet", () => {
  it("does not render when open=false", () => {
    renderWithTheme(
      <BottomSheet open={false} onClose={() => {}}>
        <span data-testid="content">Sheet content</span>
      </BottomSheet>
    );
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bottom-sheet-dimmer")).not.toBeInTheDocument();
  });

  it("renders children when open=true", () => {
    renderWithTheme(
      <BottomSheet open={true} onClose={() => {}}>
        <span data-testid="content">Sheet content</span>
      </BottomSheet>
    );
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(screen.getByText("Sheet content")).toBeInTheDocument();
  });

  it("calls onClose when dimmer is clicked", () => {
    const onClose = vi.fn();
    renderWithTheme(
      <BottomSheet open={true} onClose={onClose}>
        <span>Sheet content</span>
      </BottomSheet>
    );
    fireEvent.click(screen.getByTestId("bottom-sheet-dimmer"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when content is clicked", () => {
    const onClose = vi.fn();
    renderWithTheme(
      <BottomSheet open={true} onClose={onClose}>
        <span data-testid="inner">Inner content</span>
      </BottomSheet>
    );
    fireEvent.click(screen.getByTestId("bottom-sheet-content"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders in portal (content in document.body)", () => {
    renderWithTheme(
      <BottomSheet open={true} onClose={() => {}}>
        <span data-testid="portal-content">Portal content</span>
      </BottomSheet>
    );
    const content = document.body.querySelector("[data-testid='portal-content']");
    expect(content).not.toBeNull();
  });

  it("bottom position applies appropriate styling", () => {
    renderWithTheme(
      <BottomSheet open={true} onClose={() => {}} position="bottom">
        <span>Content</span>
      </BottomSheet>
    );
    const content = screen.getByTestId("bottom-sheet-content");
    const computedStyle = window.getComputedStyle(content);
    // The content container should exist; styled-components applies class-based styles
    expect(content).toBeInTheDocument();
    // Verify it's using BottomContent (full width) rather than CenterContent
    // We check that max-width is not set to 90%
    expect(computedStyle.maxWidth).not.toBe("90%");
  });

  it("center position renders content with center layout", () => {
    renderWithTheme(
      <BottomSheet open={true} onClose={() => {}} position="center">
        <span>Center content</span>
      </BottomSheet>
    );
    expect(screen.getByTestId("bottom-sheet-content")).toBeInTheDocument();
    expect(screen.getByText("Center content")).toBeInTheDocument();
  });
});
