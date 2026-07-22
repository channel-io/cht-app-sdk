package polling

import sdkv1 "github.com/channel-io/app-sdk/go/internal/gen/channel/app/sdk/v1"

type ProtoPoller = sdkv1.PollingPoller
type ProtoGetPollersRequest = sdkv1.PollingGetPollersInput
type ProtoGetPollersResponse = sdkv1.PollingGetPollersOutput
type ProtoGetChannelsRequest = sdkv1.PollingGetTargetChannelsInput
type ProtoGetChannelsResponse = sdkv1.PollingGetTargetChannelsOutput
