import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";

export interface BottomSheetProps {
  /** Whether the sheet is visible */
  open: boolean;
  /** Called when dimmer is clicked or close is requested */
  onClose: () => void;
  /** Sheet content */
  children: ReactNode;
  /** "bottom" slides up from bottom, "center" is centered dialog. Default "bottom" */
  position?: "bottom" | "center";
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
`;

const scaleIn = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const Dimmer = styled.div<{ position: "bottom" | "center" }>`
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: var(--bgtxt-absolute-black-lighter);
  display: flex;
  align-items: ${({ position }) => (position === "center" ? "center" : "flex-end")};
  justify-content: ${({ position }) => (position === "center" ? "center" : "stretch")};
  animation: ${fadeIn} 0.2s ease;
`;

const BottomContent = styled.div`
  background: var(--color-surface-high);
  width: 100%;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  animation: ${slideUp} 0.25s ease;
`;

const CenterContent = styled.div`
  background: var(--color-surface-high);
  border-radius: 12px;
  max-width: 90%;
  animation: ${scaleIn} 0.2s ease;
`;

export function BottomSheet({ open, onClose, children, position = "bottom" }: BottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const Content = position === "center" ? CenterContent : BottomContent;

  return createPortal(
    <Dimmer position={position} onClick={onClose} data-testid="bottom-sheet-dimmer">
      <Content onClick={(e) => e.stopPropagation()} data-testid="bottom-sheet-content">
        {children}
      </Content>
    </Dimmer>,
    document.body
  );
}
