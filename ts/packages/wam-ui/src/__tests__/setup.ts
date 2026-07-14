import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  // Reset WAM global between tests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).ChannelIOWam;
});
