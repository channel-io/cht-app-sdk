import type { ReactNode } from "react";
import { Text, VStack, Icon } from "@channel.io/bezier-react";
import type { BezierIcon } from "@channel.io/bezier-icons";
import styled from "styled-components";

export interface EmptyStateProps {
  /** Icon to display */
  icon?: BezierIcon;
  /** Title text */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional action slot (e.g., a Button) */
  action?: ReactNode;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 24px;
`;

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Container>
      {icon && <Icon source={icon} size="xl" color="icon-neutral-heavy" />}
      <VStack spacing={4} align="center">
        <Text typo="16" bold>
          {title}
        </Text>
        {description && (
          <Text typo="14" color="text-neutral-light" align="center">
            {description}
          </Text>
        )}
      </VStack>
      {action}
    </Container>
  );
}
