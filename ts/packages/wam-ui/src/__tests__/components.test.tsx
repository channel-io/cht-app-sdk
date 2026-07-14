import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WamThemeProvider } from "../providers/WamThemeProvider.js";
import { FormSection } from "../components/FormSection.js";
import { FormRow } from "../components/FormRow.js";
import { ToggleRow } from "../components/ToggleRow.js";
import { InputRow } from "../components/InputRow.js";
import { SelectRow } from "../components/SelectRow.js";
import { EmptyState } from "../components/EmptyState.js";
import { LoadingPage } from "../utilities/LoadingPage.js";
import { ErrorPage } from "../utilities/ErrorPage.js";
import { ConfirmDialog } from "../utilities/ConfirmDialog.js";

function renderWithTheme(ui: React.ReactElement) {
  return render(<WamThemeProvider>{ui}</WamThemeProvider>);
}

describe("FormSection", () => {
  it("renders title and children", () => {
    renderWithTheme(
      <FormSection title="Settings">
        <span data-testid="content">fields</span>
      </FormSection>
    );
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    renderWithTheme(<FormSection title="Settings" description="Configure your app" />);
    expect(screen.getByText("Configure your app")).toBeInTheDocument();
  });

  it("renders headerRight content", () => {
    renderWithTheme(
      <FormSection title="Settings" headerRight={<button data-testid="action">Edit</button>} />
    );
    expect(screen.getByTestId("action")).toBeInTheDocument();
  });
});

describe("FormRow", () => {
  it("renders label and children", () => {
    renderWithTheme(
      <FormRow label="Name">
        <input data-testid="input" />
      </FormRow>
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByTestId("input")).toBeInTheDocument();
  });

  it("renders helper text when provided", () => {
    renderWithTheme(
      <FormRow label="Name" helperText="Enter your name">
        <input />
      </FormRow>
    );
    expect(screen.getByText("Enter your name")).toBeInTheDocument();
  });

  it("renders using bezier FormControl and FormLabel", () => {
    renderWithTheme(
      <FormRow label="Email" required hasError>
        <input />
      </FormRow>
    );
    expect(screen.getByText("Email")).toBeInTheDocument();
    // Verify bezier FormControl is used (has data-testid)
    expect(screen.getByTestId("bezier-form-control")).toBeInTheDocument();
    expect(screen.getByTestId("bezier-form-label")).toBeInTheDocument();
  });

  it("renders labelAddon next to the label", () => {
    renderWithTheme(
      <FormRow label="Name" labelAddon={<span data-testid="addon">Optional</span>}>
        <input />
      </FormRow>
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByTestId("addon")).toBeInTheDocument();
  });
});

describe("ToggleRow", () => {
  it("renders label", () => {
    renderWithTheme(<ToggleRow label="Enable notifications" />);
    expect(screen.getByText("Enable notifications")).toBeInTheDocument();
  });

  it("renders description", () => {
    renderWithTheme(<ToggleRow label="Enable" description="Turn on notifications" />);
    expect(screen.getByText("Turn on notifications")).toBeInTheDocument();
  });

  it("associates label with switch via htmlFor/id", () => {
    renderWithTheme(<ToggleRow label="Enable" />);
    const switchEl = screen.getByRole("switch");
    const label = screen.getByText("Enable").closest("label");
    expect(label).toBeInTheDocument();
    expect(label?.getAttribute("for")).toBe(switchEl.getAttribute("id"));
  });
});

describe("InputRow", () => {
  it("renders with label and textfield", () => {
    renderWithTheme(<InputRow label="API Key" placeholder="Enter key" />);
    expect(screen.getByText("API Key")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter key")).toBeInTheDocument();
  });

  it("calls onChange when input changes", () => {
    const onChange = vi.fn();
    renderWithTheme(<InputRow label="Name" value="" onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });
    expect(onChange).toHaveBeenCalledWith("test");
  });

  it("shows character counter when showLength and maxLength are set", () => {
    renderWithTheme(<InputRow label="Bio" value="hello" maxLength={100} showLength />);
    expect(screen.getByText("5/100")).toBeInTheDocument();
  });

  it("does not show character counter when showLength is false", () => {
    renderWithTheme(<InputRow label="Bio" value="hello" maxLength={100} />);
    expect(screen.queryByText("5/100")).not.toBeInTheDocument();
  });

  it("does not show character counter when maxLength is not set", () => {
    renderWithTheme(<InputRow label="Bio" value="hello" showLength />);
    expect(screen.queryByText(/\/\d+/)).not.toBeInTheDocument();
  });

  it("renders rightContent", () => {
    renderWithTheme(
      <InputRow label="Name" rightContent={<span data-testid="right">right</span>} />
    );
    expect(screen.getByTestId("right")).toBeInTheDocument();
  });
});

describe("SelectRow", () => {
  it("renders label and trigger", () => {
    renderWithTheme(<SelectRow label="Choice" text="Option A" />);
    expect(screen.getByText("Choice")).toBeInTheDocument();
    expect(screen.getByText("Option A")).toBeInTheDocument();
  });

  it("renders placeholder when no text", () => {
    renderWithTheme(<SelectRow label="Choice" placeholder="Select..." />);
    expect(screen.getByText("Select...")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders title", () => {
    renderWithTheme(<EmptyState title="No items" />);
    expect(screen.getByText("No items")).toBeInTheDocument();
  });

  it("renders description", () => {
    renderWithTheme(<EmptyState title="No items" description="Add your first item" />);
    expect(screen.getByText("Add your first item")).toBeInTheDocument();
  });

  it("renders action slot", () => {
    const onClick = vi.fn();
    renderWithTheme(
      <EmptyState title="No items" action={<button onClick={onClick}>Add item</button>} />
    );
    const button = screen.getByText("Add item");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });
});

describe("LoadingPage", () => {
  it("renders spinner", () => {
    renderWithTheme(<LoadingPage />);
    expect(screen.getByTestId("bezier-spinner")).toBeInTheDocument();
  });

  it("renders message when provided", () => {
    renderWithTheme(<LoadingPage message="Loading data..." />);
    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });
});

describe("ErrorPage", () => {
  it("renders default error message", () => {
    renderWithTheme(<ErrorPage />);
    expect(screen.getByText("An error occurred")).toBeInTheDocument();
  });

  it("renders string error", () => {
    renderWithTheme(<ErrorPage error="Something broke" />);
    expect(screen.getByText("Something broke")).toBeInTheDocument();
  });

  it("renders Error object message", () => {
    renderWithTheme(<ErrorPage error={new Error("Network failure")} />);
    expect(screen.getByText("Network failure")).toBeInTheDocument();
  });

  it("renders retry button and handles click", () => {
    const onRetry = vi.fn();
    renderWithTheme(<ErrorPage onRetry={onRetry} />);
    const button = screen.getByText("Retry");
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalled();
  });

  it("uses custom retry text", () => {
    renderWithTheme(<ErrorPage onRetry={() => {}} retryText="Try again" />);
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });
});

describe("ConfirmDialog", () => {
  it("renders title and buttons when shown", () => {
    renderWithTheme(<ConfirmDialog show={true} onHide={() => {}} title="Delete this?" />);
    expect(screen.getByText("Delete this?")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("renders description", () => {
    renderWithTheme(
      <ConfirmDialog
        show={true}
        onHide={() => {}}
        title="Delete?"
        description="This cannot be undone"
      />
    );
    expect(screen.getByText("This cannot be undone")).toBeInTheDocument();
  });

  it("uses custom button text", () => {
    renderWithTheme(
      <ConfirmDialog
        show={true}
        onHide={() => {}}
        title="Delete?"
        confirmText="Yes, delete"
        cancelText="No, keep"
      />
    );
    expect(screen.getByText("Yes, delete")).toBeInTheDocument();
    expect(screen.getByText("No, keep")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button clicked", () => {
    const onConfirm = vi.fn();
    renderWithTheme(
      <ConfirmDialog show={true} onHide={() => {}} title="Delete?" onConfirm={onConfirm} />
    );
    fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalled();
  });
});
