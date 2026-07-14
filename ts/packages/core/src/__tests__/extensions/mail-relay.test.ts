import { describe, expect, it } from "vitest";
import {
  MailRelayFunctionNames,
  MailRelayInboundInputSchema,
  MailRelayInboundOutputSchema,
} from "../../extensions/index.js";

describe("mail relay extension schemas", () => {
  it("parses SES-backed inbound mail payloads", () => {
    const parsed = MailRelayInboundInputSchema.parse({
      slug: "amazon",
      recipient: "example+c_channel.i_installation.m_marketplace.r_token@example.mail.channel.io",
      recipients: [
        "general@mail.channel.io",
        "example+c_channel.i_installation.m_marketplace.r_token@example.mail.channel.io",
      ],
      sesMessageId: "ses-message-1",
      bucketName: "channel-inbound-mail",
      objectKey: "amazon/inbound/ses-message-1",
      mail: {
        source: "buyer@example.com",
        destination: [
          "example+c_channel.i_installation.m_marketplace.r_token@example.mail.channel.io",
        ],
        messageId: "ses-message-1",
        commonHeaders: {
          from: ["Example Buyer <buyer@example.com>"],
          to: ["example+c_channel.i_installation.m_marketplace.r_token@example.mail.channel.io"],
          subject: "Question about your listing",
        },
        headers: [{ name: "Message-ID", value: "<message@example.com>" }],
      },
      receipt: {
        timestamp: "2026-07-03T01:02:03.000Z",
        spamVerdict: "PASS",
        virusVerdict: "PASS",
        spfVerdict: "PASS",
        dkimVerdict: "PASS",
        dmarcVerdict: "PASS",
      },
    });

    expect(parsed.slug).toBe("amazon");
    expect(parsed.recipient.endsWith("@example.mail.channel.io")).toBe(true);
    expect(parsed.mail.headers[0]?.name).toBe("Message-ID");
  });

  it("rejects empty recipient lists", () => {
    expect(() =>
      MailRelayInboundInputSchema.parse({
        slug: "amazon",
        recipient: "example@test.mail.channel.io",
        recipients: [],
        sesMessageId: "ses-message-1",
        bucketName: "channel-inbound-mail",
        objectKey: "amazon/inbound/ses-message-1",
        mail: { destination: [], commonHeaders: {}, headers: [] },
        receipt: {},
      })
    ).toThrow();
  });

  it("exports mail relay function names as extension-relative names", () => {
    expect(MailRelayFunctionNames.inbound.onMailReceived).toBe("inbound.onMailReceived");
  });

  it("parses proxy retry decision outputs", () => {
    expect(
      MailRelayInboundOutputSchema.parse({
        status: "retryableFailure",
        reason: "temporary app function failure",
      }).status
    ).toBe("retryableFailure");
  });
});
