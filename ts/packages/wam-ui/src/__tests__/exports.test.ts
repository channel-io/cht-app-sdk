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

  it("exports all design components", () => {
    expect(WamUI.FormSection).toBeDefined();
    expect(WamUI.FormRow).toBeDefined();
    expect(WamUI.ToggleRow).toBeDefined();
    expect(WamUI.InputRow).toBeDefined();
    expect(WamUI.SelectRow).toBeDefined();
    expect(WamUI.EmptyState).toBeDefined();
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
    expect(WamUI.BUTTON_VARIANTS.primary.colorVariant).toBe("blue");
    expect(WamUI.TEXT_PRESETS.label.bold).toBe(true);
  });
});
