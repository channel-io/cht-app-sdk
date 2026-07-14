import { z } from "zod";
import type {
  PollingGetPollersOutput as ProtoGetPollersOutput,
  PollingGetTargetChannelsInput as ProtoGetPollingTargetChannelsInput,
  PollingGetTargetChannelsOutput as ProtoGetPollingTargetChannelsOutput,
  PollingPoller as ProtoPollingPoller,
} from "../gen/channel/app/sdk/v1/extension.js";

type ProtoBacked<T, Proto> = T & Proto;

const PositiveIntegerSchema = z.number().int().min(1);
const NonEmptyStringSchema = z.string().min(1);

/**
 * Polling handler metadata returned from extension.polling.metadata.getPollers.
 */
export const PollingPollerSchema = z.object({
  /**
   * Full app function name invoked with channel context and empty params.
   */
  functionName: NonEmptyStringSchema,
  /**
   * Handler run creation interval, in seconds.
   */
  intervalSeconds: PositiveIntegerSchema,
  /**
   * Per-call timeout, in seconds. AppStore defaults to 30 when omitted.
   */
  timeoutSeconds: PositiveIntegerSchema.optional(),
  /**
   * Per-handler max in-flight calls per polling worker process.
   */
  maxConcurrency: PositiveIntegerSchema.optional(),
  /**
   * Per-handler request rate per polling worker process.
   */
  rps: PositiveIntegerSchema.optional(),
});

export type PollingPoller = ProtoBacked<z.infer<typeof PollingPollerSchema>, ProtoPollingPoller>;

/**
 * Metadata response schema for polling handler registration.
 */
export const GetPollersOutputSchema = z.object({
  pollers: z.array(PollingPollerSchema),
});

export type GetPollersOutput = ProtoBacked<
  z.infer<typeof GetPollersOutputSchema>,
  ProtoGetPollersOutput
>;

/**
 * Input schema for extension.polling.target.getChannels.
 */
export const GetPollingTargetChannelsInputSchema = z.object({
  /**
   * Polling function name from the poller metadata currently being enqueued.
   */
  functionName: NonEmptyStringSchema,
  /**
   * Cursor previously returned as nextCursor.
   */
  cursor: NonEmptyStringSchema.optional(),
  /**
   * Maximum number of channel IDs to return.
   */
  limit: PositiveIntegerSchema.max(500),
});

export type GetPollingTargetChannelsInput = ProtoBacked<
  z.infer<typeof GetPollingTargetChannelsInputSchema>,
  ProtoGetPollingTargetChannelsInput
>;

/**
 * Output schema for extension.polling.target.getChannels.
 */
export const GetPollingTargetChannelsOutputSchema = z
  .object({
    channelIds: z.array(NonEmptyStringSchema),
    nextCursor: NonEmptyStringSchema.optional(),
    hasNextPage: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.hasNextPage === true && !value.nextCursor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "nextCursor is required when hasNextPage is true",
        path: ["nextCursor"],
      });
    }
  });

export type GetPollingTargetChannelsOutput = ProtoBacked<
  z.infer<typeof GetPollingTargetChannelsOutputSchema>,
  ProtoGetPollingTargetChannelsOutput
>;
