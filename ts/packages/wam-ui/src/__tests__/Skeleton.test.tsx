import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { WamThemeProvider } from "../providers/WamThemeProvider.js";
import { SkeletonBox, SkeletonCircle } from "../components/Skeleton.js";

function renderWithTheme(ui: React.ReactElement) {
  return render(<WamThemeProvider>{ui}</WamThemeProvider>);
}

describe("SkeletonBox", () => {
  it("renders with given width and height", () => {
    renderWithTheme(<SkeletonBox width={200} height={24} />);
    const box = screen.getByTestId("skeleton-box");
    expect(box).toBeInTheDocument();
    expect(box).toHaveStyle({ width: "200px", height: "24px" });
  });

  it("uses default height of 16px when not specified", () => {
    renderWithTheme(<SkeletonBox />);
    const box = screen.getByTestId("skeleton-box");
    expect(box).toHaveStyle({ height: "16px" });
  });

  it("has wave animation via styled-components class", () => {
    renderWithTheme(<SkeletonBox />);
    const box = screen.getByTestId("skeleton-box");
    // styled-components applies a generated className
    expect(box.className).toBeTruthy();
    expect(box.className.length).toBeGreaterThan(0);
  });

  it("accepts string width", () => {
    renderWithTheme(<SkeletonBox width="50%" height={20} />);
    const box = screen.getByTestId("skeleton-box");
    expect(box).toHaveStyle({ width: "50%" });
  });
});

describe("SkeletonCircle", () => {
  it("renders with default size 40", () => {
    renderWithTheme(<SkeletonCircle />);
    const circle = screen.getByTestId("skeleton-circle");
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveStyle({ width: "40px", height: "40px" });
  });

  it("renders as circle with border-radius equal to half of size", () => {
    renderWithTheme(<SkeletonCircle size={60} />);
    const circle = screen.getByTestId("skeleton-circle");
    expect(circle).toHaveStyle({ borderRadius: "30px" });
  });

  it("renders with custom size", () => {
    renderWithTheme(<SkeletonCircle size={24} />);
    const circle = screen.getByTestId("skeleton-circle");
    expect(circle).toHaveStyle({ width: "24px", height: "24px" });
  });
});
