import { describe, it, expect } from "vitest";
import { normalizeExtensionResult } from "../utils/extension-result-normalizer.js";

describe("normalizeExtensionResult", () => {
  it("should default command config systemVersion to v1", () => {
    const result = normalizeExtensionResult("extension.command.metadata.getCommands", {
      commands: [
        {
          name: "hello",
          scope: "desk",
          actionFunctionName: "commands.hello.execute",
          alfMode: "disable",
        },
      ],
    });

    expect(result).toEqual({
      commands: [
        {
          name: "hello",
          scope: "desk",
          actionFunctionName: "commands.hello.execute",
          systemVersion: "v1",
          alfMode: "disable",
        },
      ],
    });
  });

  it("should preserve explicit command config systemVersion", () => {
    const result = normalizeExtensionResult("metadata.getCommands", {
      commands: [
        {
          name: "hello",
          scope: "desk",
          actionFunctionName: "commands.hello.execute",
          systemVersion: "v2",
          alfMode: "disable",
        },
      ],
    });

    expect(result).toEqual({
      commands: [
        {
          name: "hello",
          scope: "desk",
          actionFunctionName: "commands.hello.execute",
          systemVersion: "v2",
          alfMode: "disable",
        },
      ],
    });
  });

  it("should default widget config systemVersion to v1", () => {
    const result = normalizeExtensionResult("extension.widget.metadata.getWidgets", {
      widgets: [
        {
          name: "quick_actions",
          scope: "desk",
          widgetType: "wam",
          actionFunctionName: "widgets.quickActions.action",
        },
      ],
    });

    expect(result).toEqual({
      widgets: [
        {
          name: "quick_actions",
          scope: "desk",
          widgetType: "wam",
          actionFunctionName: "widgets.quickActions.action",
          systemVersion: "v1",
        },
      ],
    });
  });

  it("should preserve explicit widget config systemVersion", () => {
    const result = normalizeExtensionResult("metadata.getWidgets", {
      widgets: [
        {
          name: "quick_actions",
          scope: "desk",
          widgetType: "wam",
          actionFunctionName: "widgets.quickActions.action",
          systemVersion: "v2",
        },
      ],
    });

    expect(result).toEqual({
      widgets: [
        {
          name: "quick_actions",
          scope: "desk",
          widgetType: "wam",
          actionFunctionName: "widgets.quickActions.action",
          systemVersion: "v2",
        },
      ],
    });
  });

  it("should default custom tab config systemVersion to v1", () => {
    const result = normalizeExtensionResult("extension.customtab.metadata.getCustomTabs", {
      customTabs: [
        {
          name: "analytics",
          actionFunctionName: "customtabs.analytics.action",
        },
      ],
    });

    expect(result).toEqual({
      customTabs: [
        {
          name: "analytics",
          actionFunctionName: "customtabs.analytics.action",
          systemVersion: "v1",
        },
      ],
    });
  });

  it("should keep legacy customtab getConfig normalization for backwards compatibility", () => {
    const result = normalizeExtensionResult("extension.customtab.customtab.getConfig", {
      tabs: [
        {
          name: "analytics",
        },
      ],
    });

    expect(result).toEqual({
      tabs: [
        {
          name: "analytics",
          systemVersion: "v1",
        },
      ],
    });
  });

  it("should default hook config systemVersion to v1", () => {
    const result = normalizeExtensionResult("extension.hook.metadata.getHooks", {
      hooks: [
        {
          type: "app.installed",
          actionFunctionName: "hooks.lifecycle.onAppInstalled",
        },
      ],
    });

    expect(result).toEqual({
      hooks: [
        {
          type: "app.installed",
          actionFunctionName: "hooks.lifecycle.onAppInstalled",
          systemVersion: "v1",
        },
      ],
    });
  });

  it("should preserve explicit hook config systemVersion", () => {
    const result = normalizeExtensionResult("metadata.getHooks", {
      hooks: [
        {
          type: "widget.installed",
          targetId: "quick_actions",
          actionFunctionName: "hooks.widgets.onQuickActionsInstalled",
          systemVersion: "v2",
        },
      ],
    });

    expect(result).toEqual({
      hooks: [
        {
          type: "widget.installed",
          targetId: "quick_actions",
          actionFunctionName: "hooks.widgets.onQuickActionsInstalled",
          systemVersion: "v2",
        },
      ],
    });
  });

  it("should leave unrelated methods unchanged", () => {
    const result = normalizeExtensionResult("extension.widget.widget.action", {
      success: true,
    });

    expect(result).toEqual({
      success: true,
    });
  });
});
