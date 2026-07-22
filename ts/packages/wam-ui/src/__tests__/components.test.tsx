import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "../components/EmptyState.js";
import { WamThemeProvider } from "../providers/WamThemeProvider.js";
import { ConfirmDialog } from "../utilities/ConfirmDialog.js";
import { ErrorPage } from "../utilities/ErrorPage.js";
import { LoadingPage } from "../utilities/LoadingPage.js";

function renderWithTheme(ui: React.ReactElement) {
  return render(<WamThemeProvider>{ui}</WamThemeProvider>);
}

describe("EmptyState", () => {
  it("renders title and description", () => {
    renderWithTheme(<EmptyState title="No items" description="Add your first item" />);
    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.getByText("Add your first item")).toBeInTheDocument();
  });

  it("renders the action slot", () => {
    const onClick = vi.fn();
    renderWithTheme(
      <EmptyState title="No items" action={<button onClick={onClick}>Add item</button>} />
    );
    fireEvent.click(screen.getByText("Add item"));
    expect(onClick).toHaveBeenCalled();
  });
});

describe("LoadingPage", () => {
  it("renders the Bezier beta spinner", () => {
    renderWithTheme(<LoadingPage />);
    expect(screen.getByTestId("wam-loading-spinner")).toBeInTheDocument();
  });

  it("renders a message when provided", () => {
    renderWithTheme(<LoadingPage message="Loading data..." />);
    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });
});

describe("ErrorPage", () => {
  it("renders the default error message", () => {
    renderWithTheme(<ErrorPage />);
    expect(screen.getByText("An error occurred")).toBeInTheDocument();
  });

  it("renders an Error object message", () => {
    renderWithTheme(<ErrorPage error={new Error("Network failure")} />);
    expect(screen.getByText("Network failure")).toBeInTheDocument();
  });

  it("handles retry actions", () => {
    const onRetry = vi.fn();
    renderWithTheme(<ErrorPage onRetry={onRetry} retryText="Try again" />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe("ConfirmDialog", () => {
  it("renders title, description, and actions", () => {
    renderWithTheme(
      <ConfirmDialog
        show
        onHide={() => {}}
        title="Delete?"
        description="This cannot be undone"
        confirmText="Yes, delete"
        cancelText="No, keep"
      />
    );
    expect(screen.getByText("Delete?")).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes, delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No, keep" })).toBeInTheDocument();
  });

  it("calls onConfirm", () => {
    const onConfirm = vi.fn();
    renderWithTheme(<ConfirmDialog show onHide={() => {}} title="Delete?" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
