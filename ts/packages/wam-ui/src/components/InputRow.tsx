import type { ReactNode } from "react";
import { TextField, Text, type TextFieldType } from "@channel.io/bezier-react";
import { FormRow, type FormRowProps } from "./FormRow.js";

export interface InputRowProps extends Omit<FormRowProps, "children" | "labelAddon"> {
  /** Input value */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Input type */
  type?: TextFieldType;
  /** Maximum character length */
  maxLength?: number;
  /** When true and maxLength is set, shows a character counter next to the label */
  showLength?: boolean;
  /** Content rendered on the right side of the input */
  rightContent?: ReactNode;
  /** Content rendered on the left side of the input */
  leftContent?: ReactNode;
  /** Blur handler */
  onBlur?: () => void;
  /** Whether the input is read-only */
  readOnly?: boolean;
  /** Whether to show a clear button */
  allowClear?: boolean;
}

export function InputRow({
  value,
  onChange,
  placeholder,
  type,
  maxLength,
  showLength,
  rightContent,
  leftContent,
  onBlur,
  readOnly,
  allowClear,
  ...formRowProps
}: InputRowProps) {
  const currentLength = (value ?? "").length;

  const labelAddon =
    showLength && maxLength != null ? (
      <Text typo="12" color="text-neutral-lighter">
        {currentLength}/{maxLength}
      </Text>
    ) : undefined;

  return (
    <FormRow {...formRowProps} labelAddon={labelAddon}>
      <TextField
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        type={type}
        size="m"
        maxLength={maxLength}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        rightContent={rightContent as any}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        leftContent={leftContent as any}
        onBlur={onBlur}
        readOnly={readOnly}
        allowClear={allowClear}
      />
    </FormRow>
  );
}
