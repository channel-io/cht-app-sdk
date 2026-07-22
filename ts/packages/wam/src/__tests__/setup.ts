import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();

  if (typeof window === "undefined") return;

  delete window.ChannelIOWam;
  document.documentElement.removeAttribute("style");
  document.body.removeAttribute("style");
});
