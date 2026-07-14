import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WamThemeProvider } from "../providers/WamThemeProvider.js";
import { HeightSynchronizer } from "../utilities/HeightSynchronizer.js";

// Mock ResizeObserver
let resizeCallback: ResizeObserverCallback;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    vi.fn((cb: ResizeObserverCallback) => {
      resizeCallback = cb;
      return { observe: mockObserve, disconnect: mockDisconnect, unobserve: vi.fn() };
    })
  );
  mockObserve.mockClear();
  mockDisconnect.mockClear();
});

function renderWithProvider(ui: React.ReactElement) {
  return render(<WamThemeProvider>{ui}</WamThemeProvider>);
}

describe("HeightSynchronizer", () => {
  it("renders children", () => {
    renderWithProvider(
      <HeightSynchronizer>
        <span data-testid="child">content</span>
      </HeightSynchronizer>
    );
    expect(screen.getByTestId("child")).toHaveTextContent("content");
  });

  it("creates a ResizeObserver on mount", () => {
    renderWithProvider(
      <HeightSynchronizer>
        <div>test</div>
      </HeightSynchronizer>
    );
    expect(mockObserve).toHaveBeenCalled();
  });

  it("calls setSize when height changes", () => {
    const mockSetSize = vi.fn();
    window.ChannelIOWam = {
      getWamData: vi.fn(() => null),
      setSize: mockSetSize,
      callFunction: vi.fn(),
      callNativeFunction: vi.fn(),
      close: vi.fn(),
    };

    renderWithProvider(
      <HeightSynchronizer>
        <div>test</div>
      </HeightSynchronizer>
    );

    // Simulate resize
    act(() => {
      resizeCallback(
        [{ contentRect: { height: 300, width: 400 } } as unknown as ResizeObserverEntry],
        {} as ResizeObserver
      );
    });

    expect(mockSetSize).toHaveBeenCalledWith({ height: 300 });
  });

  it("does not call setSize when height is unchanged", () => {
    const mockSetSize = vi.fn();
    window.ChannelIOWam = {
      getWamData: vi.fn(() => null),
      setSize: mockSetSize,
      callFunction: vi.fn(),
      callNativeFunction: vi.fn(),
      close: vi.fn(),
    };

    renderWithProvider(
      <HeightSynchronizer>
        <div>test</div>
      </HeightSynchronizer>
    );

    act(() => {
      resizeCallback(
        [{ contentRect: { height: 300, width: 400 } } as unknown as ResizeObserverEntry],
        {} as ResizeObserver
      );
    });
    act(() => {
      resizeCallback(
        [{ contentRect: { height: 300, width: 400 } } as unknown as ResizeObserverEntry],
        {} as ResizeObserver
      );
    });

    expect(mockSetSize).toHaveBeenCalledTimes(1);
  });

  it("respects maxHeight constraint", () => {
    const mockSetSize = vi.fn();
    window.ChannelIOWam = {
      getWamData: vi.fn(() => null),
      setSize: mockSetSize,
      callFunction: vi.fn(),
      callNativeFunction: vi.fn(),
      close: vi.fn(),
    };

    renderWithProvider(
      <HeightSynchronizer maxHeight={200}>
        <div>test</div>
      </HeightSynchronizer>
    );

    act(() => {
      resizeCallback(
        [{ contentRect: { height: 500, width: 400 } } as unknown as ResizeObserverEntry],
        {} as ResizeObserver
      );
    });

    expect(mockSetSize).toHaveBeenCalledWith({ height: 200 });
  });

  it("skips sync on root path", () => {
    renderWithProvider(
      <HeightSynchronizer pathname="/">
        <div>test</div>
      </HeightSynchronizer>
    );
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("skips sync on excluded paths", () => {
    renderWithProvider(
      <HeightSynchronizer pathname="/connect/setup" excludePaths={["/connect"]}>
        <div>test</div>
      </HeightSynchronizer>
    );
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("syncs on non-excluded paths", () => {
    renderWithProvider(
      <HeightSynchronizer pathname="/settings" excludePaths={["/connect"]}>
        <div>test</div>
      </HeightSynchronizer>
    );
    expect(mockObserve).toHaveBeenCalled();
  });

  it("disconnects observer on unmount", () => {
    const { unmount } = renderWithProvider(
      <HeightSynchronizer>
        <div>test</div>
      </HeightSynchronizer>
    );
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
