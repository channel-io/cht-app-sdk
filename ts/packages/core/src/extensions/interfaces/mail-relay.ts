import type { Context } from "../../types/context.js";
import type { MailRelayInboundInput, MailRelayInboundOutput } from "../mail-relay.js";

/**
 * Mail relay extension interface.
 *
 * Implement this interface to receive inbound mail events routed from a
 * Channel-owned SES domain such as `{slug}.mail.channel.io`.
 */
export interface MailRelayExtensionInterface {
  /**
   * Handle an inbound SES mail event for an app-owned relay recipient.
   *
   * Function name: "inbound.onMailReceived"
   */
  onMailReceived(ctx: Context, params: MailRelayInboundInput): Promise<MailRelayInboundOutput>;
}

/**
 * Mail relay extension function names.
 */
export const MailRelayFunctionNames = {
  inbound: {
    onMailReceived: "inbound.onMailReceived",
  },
} as const;
