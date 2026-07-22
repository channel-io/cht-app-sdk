package messaging

import sdkv1 "github.com/channel-io/app-sdk/go/internal/gen/channel/app/sdk/v1"

type AlfMessageType = sdkv1.AlfMessageType
type MeetMode = sdkv1.MeetMode
type MessageMeetState = sdkv1.MessageMeetState
type MessageState = sdkv1.MessageState
type MessageColorVariant = sdkv1.MessageColorVariant
type MessageOption = sdkv1.MessageOption
type MessageAlertLevel = sdkv1.MessageAlertLevel
type WritingType = sdkv1.WritingType
type UserChatState = sdkv1.ChannelUserChatState
type UserChatGoalState = sdkv1.ChannelUserChatGoalState
type UserChatSubtextType = sdkv1.ChannelUserChatSubtextType
type MissedReason = sdkv1.MissedReason
type UserType = sdkv1.ChannelUserType

const (
	AlfMessageTypeUnspecified  = sdkv1.AlfMessageType_ALF_MESSAGE_TYPE_UNSPECIFIED
	AlfMessageTypeComplete     = sdkv1.AlfMessageType_ALF_MESSAGE_TYPE_COMPLETE
	AlfMessageTypeRAG          = sdkv1.AlfMessageType_ALF_MESSAGE_TYPE_RAG
	AlfMessageTypeIncomplete   = sdkv1.AlfMessageType_ALF_MESSAGE_TYPE_INCOMPLETE
	AlfMessageTypeImpossible   = sdkv1.AlfMessageType_ALF_MESSAGE_TYPE_IMPOSSIBLE
	AlfMessageTypeCommand      = sdkv1.AlfMessageType_ALF_MESSAGE_TYPE_COMMAND
	AlfMessageTypeFAQ          = sdkv1.AlfMessageType_ALF_MESSAGE_TYPE_FAQ
	AlfMessageTypeFailed       = sdkv1.AlfMessageType_ALF_MESSAGE_TYPE_FAILED
	AlfMessageTypeRateLimited  = sdkv1.AlfMessageType_ALF_MESSAGE_TYPE_RATE_LIMITED
	AlfMessageTypeOpenUserChat = sdkv1.AlfMessageType_ALF_MESSAGE_TYPE_OPEN_USER_CHAT
	AlfMessageTypeSystem       = sdkv1.AlfMessageType_ALF_MESSAGE_TYPE_SYSTEM

	MeetModeUnspecified = sdkv1.MeetMode_MEET_MODE_UNSPECIFIED
	MeetModeAudio       = sdkv1.MeetMode_MEET_MODE_AUDIO
	MeetModeVideo       = sdkv1.MeetMode_MEET_MODE_VIDEO

	MessageMeetStateUnspecified      = sdkv1.MessageMeetState_MESSAGE_MEET_STATE_UNSPECIFIED
	MessageMeetStateLive             = sdkv1.MessageMeetState_MESSAGE_MEET_STATE_LIVE
	MessageMeetStateEnded            = sdkv1.MessageMeetState_MESSAGE_MEET_STATE_ENDED
	MessageMeetStateTranscribing     = sdkv1.MessageMeetState_MESSAGE_MEET_STATE_TRANSCRIBING
	MessageMeetStateTranscribed      = sdkv1.MessageMeetState_MESSAGE_MEET_STATE_TRANSCRIBED
	MessageMeetStateTranscribeFailed = sdkv1.MessageMeetState_MESSAGE_MEET_STATE_TRANSCRIBE_FAILED

	MessageStateUnspecified = sdkv1.MessageState_MESSAGE_STATE_UNSPECIFIED
	MessageStateSending     = sdkv1.MessageState_MESSAGE_STATE_SENDING
	MessageStateSent        = sdkv1.MessageState_MESSAGE_STATE_SENT
	MessageStateFailed      = sdkv1.MessageState_MESSAGE_STATE_FAILED
	MessageStateRemoved     = sdkv1.MessageState_MESSAGE_STATE_REMOVED

	MessageColorVariantUnspecified = sdkv1.MessageColorVariant_MESSAGE_COLOR_VARIANT_UNSPECIFIED
	MessageColorVariantCobalt      = sdkv1.MessageColorVariant_MESSAGE_COLOR_VARIANT_COBALT
	MessageColorVariantGreen       = sdkv1.MessageColorVariant_MESSAGE_COLOR_VARIANT_GREEN
	MessageColorVariantOrange      = sdkv1.MessageColorVariant_MESSAGE_COLOR_VARIANT_ORANGE
	MessageColorVariantRed         = sdkv1.MessageColorVariant_MESSAGE_COLOR_VARIANT_RED
	MessageColorVariantBlack       = sdkv1.MessageColorVariant_MESSAGE_COLOR_VARIANT_BLACK
	MessageColorVariantPink        = sdkv1.MessageColorVariant_MESSAGE_COLOR_VARIANT_PINK
	MessageColorVariantPurple      = sdkv1.MessageColorVariant_MESSAGE_COLOR_VARIANT_PURPLE

	MessageOptionUnspecified      = sdkv1.MessageOption_MESSAGE_OPTION_UNSPECIFIED
	MessageOptionActAsManager     = sdkv1.MessageOption_MESSAGE_OPTION_ACT_AS_MANAGER
	MessageOptionDisplayAsChannel = sdkv1.MessageOption_MESSAGE_OPTION_DISPLAY_AS_CHANNEL
	MessageOptionDoNotPost        = sdkv1.MessageOption_MESSAGE_OPTION_DO_NOT_POST
	MessageOptionDoNotSearch      = sdkv1.MessageOption_MESSAGE_OPTION_DO_NOT_SEARCH
	MessageOptionDoNotSendApp     = sdkv1.MessageOption_MESSAGE_OPTION_DO_NOT_SEND_APP
	MessageOptionDoNotUpdateDesk  = sdkv1.MessageOption_MESSAGE_OPTION_DO_NOT_UPDATE_DESK
	MessageOptionImmutable        = sdkv1.MessageOption_MESSAGE_OPTION_IMMUTABLE
	MessageOptionPrivate          = sdkv1.MessageOption_MESSAGE_OPTION_PRIVATE
	MessageOptionSilentToManager  = sdkv1.MessageOption_MESSAGE_OPTION_SILENT_TO_MANAGER
	MessageOptionSilentToUser     = sdkv1.MessageOption_MESSAGE_OPTION_SILENT_TO_USER

	MessageAlertLevelUnspecified = sdkv1.MessageAlertLevel_MESSAGE_ALERT_LEVEL_UNSPECIFIED
	MessageAlertLevelAlert       = sdkv1.MessageAlertLevel_MESSAGE_ALERT_LEVEL_ALERT
	MessageAlertLevelUnread      = sdkv1.MessageAlertLevel_MESSAGE_ALERT_LEVEL_UNREAD
	MessageAlertLevelNone        = sdkv1.MessageAlertLevel_MESSAGE_ALERT_LEVEL_NONE

	WritingTypeUnspecified = sdkv1.WritingType_WRITING_TYPE_UNSPECIFIED
	WritingTypeStandard    = sdkv1.WritingType_WRITING_TYPE_STANDARD
	WritingTypeCustom      = sdkv1.WritingType_WRITING_TYPE_CUSTOM
	WritingTypeEmail       = sdkv1.WritingType_WRITING_TYPE_EMAIL

	UserChatStateUnspecified = sdkv1.ChannelUserChatState_USER_CHAT_STATE_UNSPECIFIED
	UserChatStateClosed      = sdkv1.ChannelUserChatState_USER_CHAT_STATE_CLOSED
	UserChatStateOpened      = sdkv1.ChannelUserChatState_USER_CHAT_STATE_OPENED
	UserChatStateSnoozed     = sdkv1.ChannelUserChatState_USER_CHAT_STATE_SNOOZED
	UserChatStateInitial     = sdkv1.ChannelUserChatState_USER_CHAT_STATE_INITIAL
	UserChatStateMissed      = sdkv1.ChannelUserChatState_USER_CHAT_STATE_MISSED
	UserChatStateQueued      = sdkv1.ChannelUserChatState_USER_CHAT_STATE_QUEUED

	UserChatGoalStateUnspecified = sdkv1.ChannelUserChatGoalState_USER_CHAT_GOAL_STATE_UNSPECIFIED
	UserChatGoalStateAchieved    = sdkv1.ChannelUserChatGoalState_USER_CHAT_GOAL_STATE_ACHIEVED
	UserChatGoalStateNotAchieved = sdkv1.ChannelUserChatGoalState_USER_CHAT_GOAL_STATE_NOT_ACHIEVED
	UserChatGoalStateWaiting     = sdkv1.ChannelUserChatGoalState_USER_CHAT_GOAL_STATE_WAITING
	UserChatGoalStateNone        = sdkv1.ChannelUserChatGoalState_USER_CHAT_GOAL_STATE_NONE

	UserChatSubtextTypeUnspecified = sdkv1.ChannelUserChatSubtextType_USER_CHAT_SUBTEXT_TYPE_UNSPECIFIED
	UserChatSubtextTypeDescription = sdkv1.ChannelUserChatSubtextType_USER_CHAT_SUBTEXT_TYPE_DESCRIPTION
	UserChatSubtextTypeIncoming    = sdkv1.ChannelUserChatSubtextType_USER_CHAT_SUBTEXT_TYPE_INCOMING

	MissedReasonUnspecified    = sdkv1.MissedReason_MISSED_REASON_UNSPECIFIED
	MissedReasonNotInOperation = sdkv1.MissedReason_MISSED_REASON_NOT_IN_OPERATION
	MissedReasonUserLeft       = sdkv1.MissedReason_MISSED_REASON_USER_LEFT
	MissedReasonRingTimeOver   = sdkv1.MissedReason_MISSED_REASON_RING_TIME_OVER
	MissedReasonRateLimit      = sdkv1.MissedReason_MISSED_REASON_RATE_LIMIT
	MissedReasonNoOperator     = sdkv1.MissedReason_MISSED_REASON_NO_OPERATOR

	UserTypeUnspecified = sdkv1.ChannelUserType_USER_TYPE_UNSPECIFIED
	UserTypeMember      = sdkv1.ChannelUserType_USER_TYPE_MEMBER
	UserTypeLead        = sdkv1.ChannelUserType_USER_TYPE_LEAD
	UserTypeUnified     = sdkv1.ChannelUserType_USER_TYPE_UNIFIED
)

type Alf = sdkv1.Alf
type Meet = sdkv1.Meet
type MessageFile = sdkv1.MessageFile
type MessageThread = sdkv1.MessageThread
type MessageButton = sdkv1.MessageButton
type CustomPayload = sdkv1.CustomPayload
type Message = sdkv1.ChannelMessage
type PrebuiltMessage = sdkv1.PrebuiltMessage
type UserChat = sdkv1.ChannelUserChat
type User = sdkv1.ChannelUser
type WAMAttributes = sdkv1.WamAttributes
type WAMResult = sdkv1.WamResult
type UnavailableReason = sdkv1.UnavailableReason
type WritingTypeState = sdkv1.WritingTypeState
type WritingTypeMap = sdkv1.WritingTypeMap
type MediumProfile = sdkv1.MediumProfile
type OnMediumMessageCreatedInput = sdkv1.MessagingOnMediumMessageCreatedInput
type SendResult = sdkv1.MessagingSendResult
type OnMediumMessageCreatedOutput = sdkv1.MessagingOnMediumMessageCreatedOutput
type InboxOnMediumUserChatClosedInput = sdkv1.MessagingInboxOnMediumUserChatClosedInput
type InboxOnMediumUserChatClosedOutput = sdkv1.MessagingInboxOnMediumUserChatClosedOutput
type InboxGetWritingTypesInput = sdkv1.MessagingInboxGetWritingTypesInput
type InboxGetWritingTypesOutput = sdkv1.MessagingInboxGetWritingTypesOutput
type InboxGetCustomEditorWAMInput = sdkv1.MessagingInboxGetCustomEditorWamInput
type InboxGetMediumTopicSelectorWAMInput = sdkv1.MessagingInboxGetMediumTopicSelectorWamInput
type InboxGetMediumMessageErrorReasonInput = sdkv1.MessagingInboxGetMediumMessageErrorReasonInput
type InboxGetMediumMessageErrorReasonOutput = sdkv1.MessagingInboxGetMediumMessageErrorReasonOutput
type PrebuiltGetWritingTypesInput = sdkv1.MessagingPrebuiltGetWritingTypesInput
type PrebuiltGetWritingTypesOutput = sdkv1.MessagingPrebuiltGetWritingTypesOutput
type PrebuiltValidateEntityInput = sdkv1.MessagingPrebuiltValidateEntityInput
type PrebuiltValidateEntityOutput = sdkv1.MessagingPrebuiltValidateEntityOutput
type PrebuiltGetCustomEditorWAMInput = sdkv1.MessagingPrebuiltGetCustomEditorWamInput
type PrebuiltGetMediumTopicBuilderSelectorWAMInput = sdkv1.MessagingPrebuiltGetMediumTopicBuilderSelectorWamInput
type PrebuiltBuildMediumTopicsInput = sdkv1.MessagingPrebuiltBuildMediumTopicsInput
type PrebuiltBuildMediumTopicsOutput = sdkv1.MessagingPrebuiltBuildMediumTopicsOutput
type PrebuiltGetDefaultOptionsInput = sdkv1.MessagingPrebuiltGetDefaultOptionsInput
type DefaultOptions = sdkv1.MessagingDefaultOptions
type PrebuiltGetDefaultOptionsOutput = sdkv1.MessagingPrebuiltGetDefaultOptionsOutput
