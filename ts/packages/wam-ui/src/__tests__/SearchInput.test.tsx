import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WamThemeProvider } from "../providers/WamThemeProvider.js";
import { SearchInput } from "../components/SearchInput.js";

function renderWithTheme(ui: React.ReactElement) {
  return render(<WamThemeProvider>{ui}</WamThemeProvider>);
}

describe("SearchInput", () => {
  it("renders with placeholder", () => {
    renderWithTheme(<SearchInput placeholder="Search..." />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("calls onChange on input immediately when debounceMs=0", () => {
    const onChange = vi.fn();
    renderWithTheme(<SearchInput onChange={onChange} debounceMs={0} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalledWith("hello");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("debounces onChange when debounceMs > 0", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    renderWithTheme(<SearchInput onChange={onChange} debounceMs={300} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "a" } });
    fireEvent.change(input, { target: { value: "ab" } });
    fireEvent.change(input, { target: { value: "abc" } });
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("abc");
    vi.useRealTimers();
  });

  it("shows clear button by default", () => {
    renderWithTheme(<SearchInput value="hello" />);
    // bezier TextField renders a clear button icon when allowClear is true and there is value
    expect(screen.getByTestId("bezier-text-input-clear-icon")).toBeInTheDocument();
  });

  it("renders search icon", () => {
    renderWithTheme(<SearchInput />);
    // bezier Icon renders with data-testid="bezier-icon"
    expect(screen.getByTestId("bezier-icon")).toBeInTheDocument();
  });

  it("uses controlled value when provided", () => {
    const onChange = vi.fn();
    renderWithTheme(<SearchInput value="controlled" onChange={onChange} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("controlled");
    fireEvent.change(input, { target: { value: "new value" } });
    expect(onChange).toHaveBeenCalledWith("new value");
  });
});
