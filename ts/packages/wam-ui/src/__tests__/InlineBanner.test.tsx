import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { WamThemeProvider } from "../providers/WamThemeProvider.js";
import { InlineBanner } from "../components/InlineBanner.js";

function renderWithTheme(ui: React.ReactElement) {
  return render(<WamThemeProvider>{ui}</WamThemeProvider>);
}

describe("InlineBanner", () => {
  it("renders success variant with content", () => {
    renderWithTheme(<InlineBanner variant="success" content="Saved successfully" />);
    expect(screen.getByText("Saved successfully")).toBeInTheDocument();
  });

  it("renders error variant with content", () => {
    renderWithTheme(<InlineBanner variant="error" content="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders info variant with content", () => {
    renderWithTheme(<InlineBanner variant="info" content="FYI" />);
    expect(screen.getByText("FYI")).toBeInTheDocument();
  });
});
