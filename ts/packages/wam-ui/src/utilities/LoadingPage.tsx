import { Box, Spinner, Text, VStack } from "@channel.io/bezier-react/beta";

export interface LoadingPageProps {
  /** Optional message below spinner */
  message?: string;
  /** Height of the container. Default: 200 */
  height?: number;
}

export function LoadingPage({ message, height = 200 }: LoadingPageProps) {
  return (
    <Box
      height={height}
      width="100%"
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <VStack spacing={12} align="center">
        <Spinner size="24" color="icon-neutral-heavy" data-testid="wam-loading-spinner" />
        {message && (
          <Text typo="14" color="text-neutral-light">
            {message}
          </Text>
        )}
      </VStack>
    </Box>
  );
}
