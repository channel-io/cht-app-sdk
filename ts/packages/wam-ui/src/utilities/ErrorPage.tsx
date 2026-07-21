import { Center, Text, VStack, Button, Icon } from "@channel.io/bezier-react";
import { ErrorTriangleFilledIcon } from "@channel.io/bezier-icons";

export interface ErrorPageProps {
  /** Error object or message string */
  error?: Error | string;
  /** Retry callback */
  onRetry?: () => void;
  /** Retry button text. Default: 'Retry' */
  retryText?: string;
  /** Height of the container. Default: 200 */
  height?: number;
}

export function ErrorPage({ error, onRetry, retryText = "Retry", height = 200 }: ErrorPageProps) {
  const message = typeof error === "string" ? error : (error?.message ?? "An error occurred");

  return (
    <Center height={height} width="100%">
      <VStack spacing={12} align="center">
        <Icon source={ErrorTriangleFilledIcon} size="l" color="icon-neutral-heavy" />
        <Text typo="14" color="text-neutral-light">
          {message}
        </Text>
        {onRetry && (
          <Button
            text={retryText}
            styleVariant="secondary"
            colorVariant="monochrome-dark"
            size="s"
            onClick={onRetry}
          />
        )}
      </VStack>
    </Center>
  );
}
