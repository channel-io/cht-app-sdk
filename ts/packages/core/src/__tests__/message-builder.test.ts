import { describe, it, expect } from "vitest";
import { MessageBuilder } from "../utils/message-builder.js";
import { mention } from "../utils/mention.js";
import type { MessagePayload } from "../types/message.js";

describe("MessageBuilder", () => {
  it("should build an empty payload when nothing is added", () => {
    const payload = new MessageBuilder().build();
    expect(payload).toEqual({ blocks: [] });
    expect(payload.buttons).toBeUndefined();
    expect(payload.files).toBeUndefined();
  });

  it("should build a single text block", () => {
    const payload = new MessageBuilder().text("hello").build();
    expect(payload.blocks).toEqual([{ type: "text", value: "hello" }]);
    expect(payload.buttons).toBeUndefined();
  });

  it("should build a divider block", () => {
    const payload = new MessageBuilder().divider().build();
    expect(payload.blocks).toEqual([{ type: "divider" }]);
  });

  it("should chain multiple blocks in order", () => {
    const payload = new MessageBuilder().text("Header").divider().text("Footer").build();

    expect(payload.blocks).toHaveLength(3);
    expect(payload.blocks[0]).toEqual({ type: "text", value: "Header" });
    expect(payload.blocks[1]).toEqual({ type: "divider" });
    expect(payload.blocks[2]).toEqual({ type: "text", value: "Footer" });
  });

  it("should add a button with a web action", () => {
    const payload = new MessageBuilder()
      .button("Visit", { type: "web", url: "https://example.com" })
      .build();

    expect(payload.buttons).toEqual([
      {
        title: "Visit",
        action: { type: "web", url: "https://example.com" },
      },
    ]);
  });

  it("should add a button with a command action", () => {
    const payload = new MessageBuilder()
      .button("Run", {
        type: "command",
        appId: "app-1",
        name: "doSomething",
        params: { key: "value" },
      })
      .build();

    expect(payload.buttons).toEqual([
      {
        title: "Run",
        action: {
          type: "command",
          appId: "app-1",
          name: "doSomething",
          params: { key: "value" },
        },
      },
    ]);
  });

  it("should add a button with a WAM action", () => {
    const payload = new MessageBuilder()
      .button("Open WAM", {
        type: "wam",
        appId: "app-1",
        name: "myWam",
        wamArgs: { foo: "bar" },
      })
      .build();

    expect(payload.buttons).toEqual([
      {
        title: "Open WAM",
        action: {
          type: "wam",
          appId: "app-1",
          name: "myWam",
          wamArgs: { foo: "bar" },
        },
      },
    ]);
  });

  it("should add a button with a color variant", () => {
    const payload = new MessageBuilder()
      .button("Delete", { type: "web", url: "https://example.com" }, "red")
      .build();

    expect(payload.buttons).toEqual([
      {
        title: "Delete",
        colorVariant: "red",
        action: { type: "web", url: "https://example.com" },
      },
    ]);
  });

  it("should add a file attachment", () => {
    const payload = new MessageBuilder()
      .file("https://example.com/doc.pdf", "application/pdf", "doc.pdf")
      .build();

    expect(payload.files).toEqual([
      { url: "https://example.com/doc.pdf", mime: "application/pdf", fileName: "doc.pdf" },
    ]);
  });

  it("should build a full message with blocks, buttons, and files", () => {
    const payload = new MessageBuilder()
      .text("Hello world")
      .divider()
      .text("See attachment below")
      .button("Open", { type: "web", url: "https://example.com" })
      .button("Run Command", { type: "command", appId: "app-1", name: "cmd" }, "cobalt")
      .file("https://example.com/img.png", "image/png", "screenshot.png")
      .build();

    expect(payload.blocks).toHaveLength(3);
    expect(payload.blocks[0]).toEqual({ type: "text", value: "Hello world" });
    expect(payload.blocks[1]).toEqual({ type: "divider" });
    expect(payload.blocks[2]).toEqual({ type: "text", value: "See attachment below" });

    expect(payload.buttons).toHaveLength(2);
    expect(payload.buttons![0]).toEqual({
      title: "Open",
      action: { type: "web", url: "https://example.com" },
    });
    expect(payload.buttons![1]).toEqual({
      title: "Run Command",
      colorVariant: "cobalt",
      action: { type: "command", appId: "app-1", name: "cmd" },
    });

    expect(payload.files).toHaveLength(1);
    expect(payload.files![0]).toEqual({
      url: "https://example.com/img.png",
      mime: "image/png",
      fileName: "screenshot.png",
    });
  });

  it("should return copies so further mutations do not affect previous result", () => {
    const builder = new MessageBuilder().text("first");
    const first = builder.build();

    builder.text("second");
    builder.button("Btn", { type: "web", url: "https://example.com" });
    const second = builder.build();

    expect(first.blocks).toHaveLength(1);
    expect(first.buttons).toBeUndefined();
    expect(second.blocks).toHaveLength(2);
    expect(second.buttons).toHaveLength(1);
  });

  it("should work with mention() inside text()", () => {
    const payload = new MessageBuilder().text(`Hello ${mention("mgr-1", "Alice")}!`).build();

    expect(payload.blocks).toEqual([
      {
        type: "text",
        value: 'Hello <link type="manager" value="mgr-1">@Alice</link>!',
      },
    ]);
  });

  it("should support multiple mentions in a single text block", () => {
    const payload = new MessageBuilder()
      .text(`${mention("1", "Alice")} and ${mention("2", "Bob")}`)
      .build();

    expect(payload.blocks[0]).toEqual({
      type: "text",
      value:
        '<link type="manager" value="1">@Alice</link> and <link type="manager" value="2">@Bob</link>',
    });
  });

  it("should satisfy MessagePayload type", () => {
    const payload: MessagePayload = new MessageBuilder()
      .text("typed")
      .button("ok", { type: "web", url: "https://example.com" })
      .build();

    expect(payload.blocks).toHaveLength(1);
    expect(payload.buttons).toHaveLength(1);
  });

  it("should clear all blocks, buttons, and files on reset()", () => {
    const builder = new MessageBuilder()
      .text("first")
      .button("btn", { type: "web", url: "https://example.com" })
      .file("https://example.com/f.txt", "text/plain", "f.txt");
    builder.reset();

    const payload = builder.build();
    expect(payload.blocks).toEqual([]);
    expect(payload.buttons).toBeUndefined();
    expect(payload.files).toBeUndefined();
  });

  it("should allow chaining after reset()", () => {
    const payload = new MessageBuilder().text("old").reset().text("new").build();

    expect(payload.blocks).toEqual([{ type: "text", value: "new" }]);
  });

  it("should omit buttons from payload when none are added", () => {
    const payload = new MessageBuilder().text("no buttons").build();
    expect("buttons" in payload).toBe(false);
  });

  it("should omit files from payload when none are added", () => {
    const payload = new MessageBuilder().text("no files").build();
    expect("files" in payload).toBe(false);
  });
});

describe("mention", () => {
  it("should format a manager mention", () => {
    expect(mention("123", "Alice")).toBe('<link type="manager" value="123">@Alice</link>');
  });

  it("should escape & in name", () => {
    expect(mention("456", "Bob & Carol")).toBe(
      '<link type="manager" value="456">@Bob &amp; Carol</link>'
    );
  });

  it("should escape < and > in name", () => {
    expect(mention("456", "Bob <script>")).toBe(
      '<link type="manager" value="456">@Bob &lt;script&gt;</link>'
    );
  });

  it("should escape double quotes in managerId", () => {
    expect(mention('a"b', "Alice")).toBe('<link type="manager" value="a&quot;b">@Alice</link>');
  });

  it("should escape single quotes in name", () => {
    expect(mention("123", "O'Brien")).toBe('<link type="manager" value="123">@O&#39;Brien</link>');
  });

  it("should handle empty name", () => {
    expect(mention("789", "")).toBe('<link type="manager" value="789">@</link>');
  });
});
