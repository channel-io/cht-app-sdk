/**
 * Message types for Channel Talk messages.
 *
 * These types match the proto definitions in Channel API contracts/coreapi/v1/model/message.proto
 * and Channel API contracts/coreapi/v1/service/message.proto.
 *
 * Key design: blocks, buttons, and files are SEPARATE fields in WriteMessageRequestDto,
 * not a single polymorphic array.
 */

// ============================================
// Block Types (go into `blocks` field)
// ============================================

/**
 * Text block -- renders a text message.
 * Supports Channel Talk markup including mentions.
 */
export interface TextBlock {
  type: "text";
  /** Text content (may contain Channel Talk markup such as mentions) */
  value: string;
}

/**
 * Divider block -- renders a horizontal separator.
 */
export interface DividerBlock {
  type: "divider";
}

/**
 * A single message block. Discriminated on `type`.
 * Only text and divider blocks belong in the `blocks` array.
 */
export type MessageBlock = TextBlock | DividerBlock;

// ============================================
// Button Types (go into `buttons` field, max 2)
// ============================================

/** Color variants for message buttons, matching MessageColorVariant proto enum. */
export type MessageButtonColorVariant =
  "cobalt" | "green" | "orange" | "red" | "black" | "pink" | "purple";

/** Triggers an app command when the button is clicked. */
export interface CommandAction {
  type: "command";
  appId: string;
  name: string;
  params?: Record<string, unknown>;
}

/** Opens a web URL when the button is clicked. */
export interface WebAction {
  type: "web";
  url: string;
}

/** Opens a WAM (Web App Module) when the button is clicked. */
export interface WAMAction {
  type: "wam";
  appId: string;
  name: string;
  clientId?: string;
  wamArgs?: Record<string, unknown>;
}

/** Discriminated union of button action types. */
export type MessageButtonAction = CommandAction | WebAction | WAMAction;

/**
 * A message button, matching Message.Button proto.
 * title: 1-30 characters, required.
 * action: required (oneof CommandAction | WebAction | WAMAction).
 */
export interface MessageButton {
  title: string;
  colorVariant?: MessageButtonColorVariant;
  action: MessageButtonAction;
}

// ============================================
// File Types (go into `files` field, max 30)
// ============================================

/**
 * A message file attachment, matching Message.File proto.
 * All fields are required.
 */
export interface MessageFile {
  url: string;
  mime: string;
  fileName: string;
}

// ============================================
// MessagePayload (return type of MessageBuilder.build())
// ============================================

/**
 * The payload returned by MessageBuilder.build().
 * Matches the structure of WriteMessageRequestDto with blocks, buttons, and files
 * as separate fields.
 */
export interface MessagePayload {
  blocks: MessageBlock[];
  buttons?: MessageButton[];
  files?: MessageFile[];
}
