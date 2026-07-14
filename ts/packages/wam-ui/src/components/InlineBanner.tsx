import { Banner } from "@channel.io/bezier-react";
import { CheckCircleFilledIcon, ErrorTriangleFilledIcon } from "@channel.io/bezier-icons";

export interface InlineBannerProps {
  /** Banner variant */
  variant: "success" | "error" | "info";
  /** Message text */
  content: string;
}

const VARIANT_CONFIG = {
  success: {
    icon: CheckCircleFilledIcon,
    bezierVariant: "green" as const,
  },
  error: {
    icon: ErrorTriangleFilledIcon,
    bezierVariant: "orange" as const,
  },
  info: {
    icon: null,
    bezierVariant: "default" as const,
  },
} as const;

/**
 * Inline feedback banner for success/error/info messages.
 *
 * Wraps bezier `Banner` with preset icon + color combinations
 * matching the Channel App platform and app-kakao patterns.
 *
 * @example
 * ```tsx
 * {message && <InlineBanner variant="success" content="Saved successfully" />}
 * {error && <InlineBanner variant="error" content={error.message} />}
 * ```
 */
export function InlineBanner({ variant, content }: InlineBannerProps) {
  const config = VARIANT_CONFIG[variant];

  return <Banner icon={config.icon} variant={config.bezierVariant} content={content} />;
}
