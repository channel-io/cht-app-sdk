import { type KeyboardEvent as ReactKeyboardEvent, type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";

export interface BottomSheetProps {
  /** Whether the sheet is visible */
  open: boolean;
  /** Called when dimmer is clicked or close is requested */
  onClose: () => void;
  /** Sheet content */
  children: ReactNode;
  /** Accessible name announced when the sheet opens */
  ariaLabel: string;
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
  z-index: var(--layer-z-index-modal);
  background: var(--color-dim-absolute-black);
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

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function BottomSheet({
  open,
  onClose,
  children,
  ariaLabel,
  position = "bottom",
}: BottomSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    contentRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose, open]);

  function keepFocusInside(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  if (!open) {
    return null;
  }

  const Content = position === "center" ? CenterContent : BottomContent;

  return createPortal(
    <Dimmer position={position} onClick={onClose} data-testid="bottom-sheet-dimmer">
      <Content
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        onKeyDown={keepFocusInside}
        onClick={(event) => event.stopPropagation()}
        data-testid="bottom-sheet-content"
      >
        {children}
      </Content>
    </Dimmer>,
    document.body
  );
}
