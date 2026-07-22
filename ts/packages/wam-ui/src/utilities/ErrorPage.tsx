import { Box, Text, VStack, Button, Icon } from "@channel.io/bezier-react/beta";
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
    <Box
      height={height}
      width="100%"
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <VStack spacing={12} align="center">
        <Icon source={ErrorTriangleFilledIcon} size="24" color="icon-neutral-heavy" />
        <Text typo="14" color="text-neutral-light">
          {message}
        </Text>
        {onRetry && (
          <Button
            label={retryText}
            variant="outlined"
            semantic="secondary"
            size="s"
            onClick={onRetry}
          />
        )}
      </VStack>
    </Box>
  );
}
