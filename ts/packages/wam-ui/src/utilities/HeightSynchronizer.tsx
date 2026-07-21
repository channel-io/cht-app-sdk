import { type PropsWithChildren, useEffect, useRef, useState } from "react";
import { Box } from "@channel.io/bezier-react";

export interface HeightSynchronizerProps extends PropsWithChildren {
  /** Paths where height sync is disabled (e.g., ['/connect']) */
  excludePaths?: string[];
  /** Current pathname — pass from your router. If omitted, always syncs. */
  pathname?: string;
  /** Max height constraint */
  maxHeight?: number;
}

function setWamSize(size: { width?: number; height: number }) {
  try {
    const wam = window.ChannelIOWam;
    if (wam != null && typeof wam.setSize === "function") {
      wam.setSize(size);
    }
  } catch {
    // ignore — not in WAM context
  }
}

export function HeightSynchronizer({
  children,
  excludePaths = [],
  pathname,
  maxHeight,
}: HeightSynchronizerProps) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const excludePathsRef = useRef(excludePaths);
  excludePathsRef.current = excludePaths;

  useEffect(
    function syncHeight() {
      if (!ref) return;

      if (
        pathname !== undefined &&
        (pathname === "/" || excludePathsRef.current.some((path) => pathname.startsWith(path)))
      ) {
        return;
      }

      let lastHeight = 0;
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry?.contentRect) return;

        const { height } = entry.contentRect;
        if (height === lastHeight) return;

        lastHeight = height;
        const finalHeight = maxHeight ? Math.min(height, maxHeight) : height;
        setWamSize({ height: finalHeight });
      });

      observer.observe(ref);
      return () => {
        observer.disconnect();
      };
    },
    [ref, pathname, maxHeight]
  );

  return (
    <Box ref={setRef} backgroundColor="surface-high">
      {children}
    </Box>
  );
}
