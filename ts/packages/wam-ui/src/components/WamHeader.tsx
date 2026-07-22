import type { ReactNode } from "react";
import { IconButton, Text } from "@channel.io/bezier-react/beta";
import { ChevronLeftIcon, CancelIcon } from "@channel.io/bezier-icons";
import styled from "styled-components";

export interface WamHeaderProps {
  /** Header title */
  title: string;
  /** Whether to show the back button */
  showBackButton?: boolean;
  /** Callback for back button. Defaults to history.back() */
  onBack?: () => void;
  /** Whether to show the close button. Default: true */
  showCloseButton?: boolean;
  /** Callback for close button. Defaults to window.ChannelIOWam?.close() */
  onClose?: () => void;
  /** Optional content rendered to the left of the close button */
  rightContent?: ReactNode;
}

const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 56px;
  padding: 0 16px;
`;

const TitleWrapper = styled.div`
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0 8px;
`;

const RightGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

export function WamHeader({
  title,
  showBackButton = false,
  onBack,
  showCloseButton = true,
  onClose,
  rightContent,
}: WamHeaderProps) {
  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      history.back();
    }
  }

  function handleClose() {
    if (onClose) {
      onClose();
    } else {
      window.ChannelIOWam?.close();
    }
  }

  return (
    <Header>
      {showBackButton ? (
        <IconButton
          content={ChevronLeftIcon}
          size="s"
          variant="ghost"
          semantic="secondary"
          onClick={handleBack}
          aria-label="Back"
        />
      ) : (
        <div style={{ width: 32, flexShrink: 0 }} />
      )}

      <TitleWrapper>
        <Text typo="18" bold>
          {title}
        </Text>
      </TitleWrapper>

      <RightGroup>
        {rightContent}
        {showCloseButton && (
          <IconButton
            content={CancelIcon}
            size="s"
            variant="ghost"
            semantic="secondary"
            onClick={handleClose}
            aria-label="Close"
          />
        )}
      </RightGroup>
    </Header>
  );
}
