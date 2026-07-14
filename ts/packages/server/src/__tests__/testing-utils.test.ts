import { describe, it, expect } from "vitest";
import "reflect-metadata";
import { z } from "zod";
import {
  Extension,
  Func,
  Ctx,
  Input,
  InputSchema,
  OutputSchema,
  Description,
} from "../decorators/index.js";
import { createMockContext, createTestExtension } from "../testing/index.js";
import {
  OnMediumMessageCreatedInputSchema,
  type Context,
  type OnMediumMessageCreatedInput,
} from "../../../core/src/index.js";

// Test extension for testing utilities
const TestInputSchema = z.object({
  name: z.string(),
});

const TestOutputSchema = z.object({
  greeting: z.string(),
});

const SnakeMessagingInputSchema = z.object({
  user_chat: z.object({
    medium_topic_key: z.string(),
  }),
});

@Extension({ name: "calendar", systemVersion: "v1" })
class TestExtension {
  @Func("test.greet")
  @Description("Greet a user")
  @InputSchema(TestInputSchema)
  @OutputSchema(TestOutputSchema)
  async greet(
    @Ctx() ctx: Context,
    @Input() params: z.infer<typeof TestInputSchema>
  ): Promise<z.infer<typeof TestOutputSchema>> {
    return {
      greeting: `Hello, ${params.name}! Channel: ${ctx.channel.id}`,
    };
  }

  @Func("test.noSchema")
  async noSchema(@Ctx() ctx: Context, @Input() params: { value: number }) {
    return { result: params.value * 2, channelId: ctx.channel.id };
  }
}

@Extension({ name: "messaging", systemVersion: "v1" })
class MessagingTestExtension {
  @Func("inbox.onMediumMessageCreated")
  @InputSchema(OnMediumMessageCreatedInputSchema)
  async onMediumMessageCreated(@Input() params: OnMediumMessageCreatedInput) {
    return {
      mediumTopicKey: params.userChat.mediumTopicKey,
      plainText: params.message.plainText,
      userChatVersion: params.userChat.version,
      messageVersion: params.message.version,
      waitingTime: params.userChat.waitingTime,
    };
  }

  @Func("inbox.legacySnake")
  @InputSchema(SnakeMessagingInputSchema)
  async legacySnake(@Input() params: z.infer<typeof SnakeMessagingInputSchema>) {
    return {
      mediumTopicKey: params.user_chat.medium_topic_key,
    };
  }
}

describe("Testing Utilities", () => {
  describe("createMockContext", () => {
    it("should create context with default values", () => {
      const ctx = createMockContext();

      expect(ctx.channel.id).toBe("test-channel-id");
      expect(ctx.caller.type).toBe("manager");
      expect(ctx.caller.id).toBe("test-caller-id");
    });

    it("should create context with custom values", () => {
      const ctx = createMockContext({
        channelId: "custom-channel",
        callerType: "user",
        callerId: "user-123",
        authToken: "test-token",
        config: {
          providerId: "store-123",
        },
      });

      expect(ctx.channel.id).toBe("custom-channel");
      expect(ctx.caller.type).toBe("user");
      expect(ctx.caller.id).toBe("user-123");
      expect(ctx.authToken).toBe("test-token");
      expect(ctx.config).toEqual({
        providerId: "store-123",
      });
    });
  });

  describe("createTestExtension", () => {
    it("should create test extension with metadata", () => {
      const { instance, extensionName, functionNames } = createTestExtension(TestExtension);

      expect(instance).toBeInstanceOf(TestExtension);
      expect(extensionName).toBe("calendar");
      expect(functionNames).toContain("test.greet");
      expect(functionNames).toContain("test.noSchema");
    });

    it("should throw error for non-decorated class", () => {
      class NotAnExtension {}

      expect(() => createTestExtension(NotAnExtension)).toThrow("not decorated with @Extension");
    });

    it("should call function with schema validation", async () => {
      const { callFunction } = createTestExtension(TestExtension);

      const result = await callFunction<
        z.infer<typeof TestInputSchema>,
        z.infer<typeof TestOutputSchema>
      >("test.greet", { name: "World" });

      expect(result.greeting).toContain("Hello, World!");
      expect(result.greeting).toContain("test-channel-id");
    });

    it("should call function with custom context", async () => {
      const { callFunction } = createTestExtension(TestExtension);

      const result = await callFunction<
        z.infer<typeof TestInputSchema>,
        z.infer<typeof TestOutputSchema>
      >("test.greet", { name: "Test" }, { channelId: "custom-channel" });

      expect(result.greeting).toContain("custom-channel");
    });

    it("should call function without schema", async () => {
      const { callFunction } = createTestExtension(TestExtension);

      const result = await callFunction<{ value: number }, { result: number; channelId: string }>(
        "test.noSchema",
        { value: 21 }
      );

      expect(result.result).toBe(42);
    });

    it("should throw error for invalid input", async () => {
      const { callFunction } = createTestExtension(TestExtension);

      await expect(
        callFunction("test.greet", { name: 123 }) // Invalid: should be string
      ).rejects.toThrow();
    });

    it("should throw error for unknown function", async () => {
      const { callFunction } = createTestExtension(TestExtension);

      await expect(callFunction("unknown.function", {})).rejects.toThrow("not found");
    });

    it("should camelize snake_case params for messaging extension input validation", async () => {
      const { callFunction } = createTestExtension(MessagingTestExtension);

      await expect(
        callFunction("inbox.onMediumMessageCreated", {
          user_chat: {
            id: "user-chat-1",
            channel_id: "channel-1",
            user_id: "user-1",
            medium_type: "app",
            medium_topic_key: "topic-1",
            version: "5",
            waiting_time: "10",
          },
          message: {
            id: "message-1",
            channel_id: "channel-1",
            chat_type: "userChat",
            chat_id: "user-chat-1",
            person_type: "user",
            person_id: "user-1",
            language: "ko",
            created_at: "2026-04-09T11:47:05Z",
            plain_text: "hello",
            version: "1",
          },
        })
      ).resolves.toEqual({
        mediumTopicKey: "topic-1",
        plainText: "hello",
        userChatVersion: "5",
        messageVersion: "1",
        waitingTime: "10",
      });
    });

    it("should prefer existing camelCase values when both cases are present", async () => {
      const { callFunction } = createTestExtension(MessagingTestExtension);

      await expect(
        callFunction("inbox.onMediumMessageCreated", {
          userChat: {
            id: "user-chat-1",
            channelId: "channel-1",
            userId: "user-1",
            mediumType: "app",
            mediumTopicKey: "camel-topic",
          },
          user_chat: {
            medium_topic_key: "snake-topic",
          },
          message: {
            id: "message-1",
            channelId: "channel-1",
            chatType: "userChat",
            chatId: "user-chat-1",
            personType: "user",
            personId: "user-1",
            language: "ko",
            createdAt: "2026-04-09T11:47:05Z",
            plainText: "camel text",
            plain_text: "snake text",
          },
        })
      ).resolves.toEqual({
        mediumTopicKey: "camel-topic",
        plainText: "camel text",
        userChatVersion: undefined,
        messageVersion: undefined,
        waitingTime: undefined,
      });
    });

    it("should still accept raw snake_case schemas for messaging extensions", async () => {
      const { callFunction } = createTestExtension(MessagingTestExtension);

      await expect(
        callFunction("inbox.legacySnake", {
          user_chat: {
            medium_topic_key: "topic-1",
          },
        })
      ).resolves.toEqual({
        mediumTopicKey: "topic-1",
      });
    });

    it("should not camelize params for non-messaging extensions", async () => {
      const { callFunction } = createTestExtension(TestExtension);

      await expect(callFunction("test.greet", { first_name: "World" })).rejects.toThrow();
    });
  });
});
