import { describe, it, expect } from "vitest";
import * as WamUI from "../index.js";

describe("package exports", () => {
  it("exports all infrastructure components", () => {
    expect(WamUI.WamThemeProvider).toBeDefined();
    expect(WamUI.HeightSynchronizer).toBeDefined();
    expect(WamUI.LoadingPage).toBeDefined();
    expect(WamUI.ErrorPage).toBeDefined();
    expect(WamUI.ConfirmDialog).toBeDefined();
  });

  it("exports WAM-specific components", () => {
    expect(WamUI.EmptyState).toBeDefined();
    expect(WamUI.SkeletonBox).toBeDefined();
    expect(WamUI.SkeletonCircle).toBeDefined();
    expect(WamUI.BottomSheet).toBeDefined();
    expect(WamUI.WamHeader).toBeDefined();
    expect(WamUI.InlineBanner).toBeDefined();
  });

  it("exports design tokens", () => {
    expect(WamUI.TYPO).toBeDefined();
    expect(WamUI.SPACING).toBeDefined();
    expect(WamUI.BUTTON_VARIANTS).toBeDefined();
    expect(WamUI.TEXT_PRESETS).toBeDefined();
  });

  it("has correct token values", () => {
    expect(WamUI.TYPO["14"]).toEqual({ fontSize: "14px", lineHeight: "20px" });
    expect(WamUI.SPACING.wamMaxWidth).toBe("520px");
    expect(WamUI.BUTTON_VARIANTS.primary.semantic).toBe("primary");
    expect(WamUI.BUTTON_VARIANTS.primary.variant).toBe("filled");
    expect(WamUI.TEXT_PRESETS.label.bold).toBe(true);
  });
});
