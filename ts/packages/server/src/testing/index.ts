/**
 * Testing utilities for Channel.io App SDK
 *
 * This module provides utilities for testing extensions and functions
 * without running the full NestJS application.
 */

export { createMockContext, type MockContextOptions } from "./mock-context.js";
export { createTestExtension, type TestExtensionResult } from "./test-extension.js";
