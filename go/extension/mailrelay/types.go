package mailrelay

import sdkv1 "github.com/channel-io/cht-app-sdk/go/internal/gen/channel/app/sdk/v1"

type InboundInput = sdkv1.MailRelayInboundInput
type InboundMail = sdkv1.MailRelayMail
type CommonHeaders = sdkv1.MailRelayCommonHeaders
type Header = sdkv1.MailRelayHeader
type Receipt = sdkv1.MailRelayReceipt
type InboundOutput = sdkv1.MailRelayInboundOutput

const (
	StatusAccepted         = "accepted"
	StatusIgnored          = "ignored"
	StatusDuplicate        = "duplicate"
	StatusRetryableFailure = "retryableFailure"
	StatusPermanentFailure = "permanentFailure"
)
