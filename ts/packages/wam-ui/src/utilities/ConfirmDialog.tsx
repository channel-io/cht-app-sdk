import type { MouseEventHandler } from "react";
import {
  ConfirmModal,
  ConfirmModalContent,
  ConfirmModalHeader,
  ConfirmModalFooter,
  ConfirmModalClose,
  Button,
  ButtonGroup,
} from "@channel.io/bezier-react";

export interface ConfirmDialogProps {
  /** Dialog title */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Confirm button text. Default: 'Confirm' */
  confirmText?: string;
  /** Cancel button text. Default: 'Cancel' */
  cancelText?: string;
  /** Use red/danger color for confirm button */
  destructive?: boolean;
  /** Confirm callback */
  onConfirm?: MouseEventHandler;
  /** Whether the dialog is visible */
  show: boolean;
  /** Hide callback */
  onHide: () => void;
}

/**
 * Desk-style confirmation dialog.
 *
 * Works standalone or with @ebay/nice-modal-react:
 *
 * @example Standalone
 * ```tsx
 * <ConfirmDialog
 *   show={isOpen}
 *   onHide={() => setIsOpen(false)}
 *   title="Delete item?"
 *   destructive
 *   onConfirm={handleDelete}
 * />
 * ```
 *
 * @example With NiceModal
 * ```tsx
 * import NiceModal, { useModal } from '@ebay/nice-modal-react'
 *
 * const MyConfirm = NiceModal.create((props: ConfirmDialogProps) => {
 *   const { visible, remove } = useModal()
 *   return <ConfirmDialog {...props} show={visible} onHide={remove} />
 * })
 * ```
 */
export function ConfirmDialog({
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  onConfirm,
  show,
  onHide,
}: ConfirmDialogProps) {
  return (
    <ConfirmModal show={show} onHide={onHide}>
      <ConfirmModalContent width={420}>
        <ConfirmModalHeader title={title} description={description} />
        <ConfirmModalFooter
          rightContent={
            <ButtonGroup>
              <ConfirmModalClose>
                <Button
                  colorVariant="monochrome-light"
                  styleVariant="secondary"
                  text={cancelText}
                />
              </ConfirmModalClose>
              <ConfirmModalClose>
                <Button
                  colorVariant={destructive ? "red" : "blue"}
                  styleVariant="primary"
                  text={confirmText}
                  onClick={onConfirm}
                />
              </ConfirmModalClose>
            </ButtonGroup>
          }
        />
      </ConfirmModalContent>
    </ConfirmModal>
  );
}
