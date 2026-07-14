import type { PropsWithChildren, ReactNode } from "react";
import { Text, VStack } from "@channel.io/bezier-react";
import styled from "styled-components";

export interface FormSectionProps extends PropsWithChildren {
  /** Section title */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Optional right-side content in header */
  headerRight?: ReactNode;
}

const Section = styled.div`
  padding: 24px 0;

  & + & {
    border-top: 1px solid var(--bdr-black-light);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

export function FormSection({ title, description, headerRight, children }: FormSectionProps) {
  return (
    <Section>
      <VStack spacing={16}>
        <Header>
          <VStack spacing={4}>
            <Text typo="16" bold>
              {title}
            </Text>
            {description && (
              <Text typo="13" color="txt-black-dark">
                {description}
              </Text>
            )}
          </VStack>
          {headerRight}
        </Header>
        <VStack spacing={12}>{children}</VStack>
      </VStack>
    </Section>
  );
}
