import { Center, Spinner, Text, VStack } from "@channel.io/bezier-react";

export interface LoadingPageProps {
  /** Optional message below spinner */
  message?: string;
  /** Height of the container. Default: 200 */
  height?: number;
}

export function LoadingPage({ message, height = 200 }: LoadingPageProps) {
  return (
    <Center height={height} width="100%">
      <VStack spacing={12} align="center">
        <Spinner color="txt-black-darker" />
        {message && (
          <Text typo="14" color="txt-black-darker">
            {message}
          </Text>
        )}
      </VStack>
    </Center>
  );
}
