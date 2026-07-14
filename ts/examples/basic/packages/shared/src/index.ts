/**
 * Shared types for Basic Example app
 */

export interface CommandResult {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface Command {
  name: string;
  description: string;
}
