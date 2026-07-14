/**
 * Escapes HTML special characters to prevent markup injection.
 *
 * @internal
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Creates a Channel Talk manager mention markup string.
 *
 * Both `managerId` and `name` are HTML-escaped to prevent markup injection.
 *
 * @param managerId - The manager's ID
 * @param name - Display name shown after the "@" symbol
 * @returns Formatted mention string for use in text blocks
 *
 * @example
 * ```typescript
 * mention("123", "Alice")
 * // => '<link type="manager" value="123">@Alice</link>'
 *
 * // Use inside MessageBuilder:
 * new MessageBuilder()
 *   .text(`Hello ${mention("123", "Alice")}!`)
 *   .build();
 * ```
 */
export function mention(managerId: string, name: string): string {
  return `<link type="manager" value="${escapeHtml(managerId)}">@${escapeHtml(name)}</link>`;
}
