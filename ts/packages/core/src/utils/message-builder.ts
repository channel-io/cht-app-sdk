import type {
  MessageBlock,
  MessageButton,
  MessageButtonAction,
  MessageButtonColorVariant,
  MessageFile,
  MessagePayload,
} from "../types/message.js";

/**
 * Fluent builder for composing Channel Talk messages.
 *
 * Blocks (text, divider) go into the `blocks` array.
 * Buttons go into a separate `buttons` array (max 2).
 * Files go into a separate `files` array (max 30).
 *
 * This matches the proto structure of WriteMessageRequestDto.
 *
 * @example
 * ```typescript
 * import { MessageBuilder, mention } from '@channel.io/app-sdk-core';
 *
 * const payload = new MessageBuilder()
 *   .text(`Hello ${mention("mgr-1", "Alice")}!`)
 *   .divider()
 *   .text("Check this out:")
 *   .button("Open Dashboard", { type: "web", url: "https://example.com" })
 *   .file("https://example.com/report.pdf", "application/pdf", "report.pdf")
 *   .build();
 *
 * // payload.blocks  -> [TextBlock, DividerBlock, TextBlock]
 * // payload.buttons -> [{ title: "Open Dashboard", action: { ... } }]
 * // payload.files   -> [{ url: "...", mime: "...", fileName: "..." }]
 * ```
 */
export class MessageBuilder {
  private readonly _blocks: MessageBlock[] = [];
  private readonly _buttons: MessageButton[] = [];
  private readonly _files: MessageFile[] = [];

  /**
   * Append a text block.
   *
   * @param value - Text content (may include mention markup)
   */
  text(value: string): this {
    this._blocks.push({ type: "text", value });
    return this;
  }

  /**
   * Append a horizontal divider block.
   */
  divider(): this {
    this._blocks.push({ type: "divider" });
    return this;
  }

  /**
   * Add a button to the message.
   * Buttons are a separate field from blocks (max 2 per message).
   *
   * @param title - Button display label (1-30 characters)
   * @param action - The action to perform when clicked
   * @param colorVariant - Optional color variant
   */
  button(
    title: string,
    action: MessageButtonAction,
    colorVariant?: MessageButtonColorVariant
  ): this {
    const btn: MessageButton = { title, action };
    if (colorVariant !== undefined) {
      btn.colorVariant = colorVariant;
    }
    this._buttons.push(btn);
    return this;
  }

  /**
   * Add a file attachment to the message.
   * Files are a separate field from blocks (max 30 per message).
   *
   * @param url - File URL
   * @param mime - MIME type (e.g. "image/png", "application/pdf")
   * @param fileName - Display file name
   */
  file(url: string, mime: string, fileName: string): this {
    this._files.push({ url, mime, fileName });
    return this;
  }

  /**
   * Remove all accumulated blocks, buttons, and files, allowing the builder to be reused.
   */
  reset(): this {
    this._blocks.length = 0;
    this._buttons.length = 0;
    this._files.length = 0;
    return this;
  }

  /**
   * Return the accumulated message payload.
   * The builder can continue to be used after calling build().
   *
   * @returns A MessagePayload with blocks, and optionally buttons and files.
   */
  build(): MessagePayload {
    const payload: MessagePayload = {
      blocks: [...this._blocks],
    };
    if (this._buttons.length > 0) {
      payload.buttons = [...this._buttons];
    }
    if (this._files.length > 0) {
      payload.files = [...this._files];
    }
    return payload;
  }
}
