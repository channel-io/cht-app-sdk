import type { PropsWithChildren, ReactNode } from "react";
import { FormControl, FormLabel, FormHelperText, HStack } from "@channel.io/bezier-react";

export interface FormRowProps extends PropsWithChildren {
  /** Field label */
  label: string;
  /** Optional helper text below the field */
  helperText?: string;
  /** Whether the field has an error */
  hasError?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Label position: 'top' stacks vertically, 'left' uses side-by-side grid */
  labelPosition?: "top" | "left";
  /** Optional inline content rendered to the right of the label */
  labelAddon?: ReactNode;
}

export function FormRow({
  label,
  helperText,
  hasError = false,
  required = false,
  disabled = false,
  labelPosition = "top",
  labelAddon,
  children,
}: FormRowProps) {
  return (
    <FormControl
      labelPosition={labelPosition}
      hasError={hasError}
      required={required}
      disabled={disabled}
    >
      {labelAddon ? (
        <HStack justify="between" align="center">
          <FormLabel typo="13" bold>
            {label}
          </FormLabel>
          {labelAddon}
        </HStack>
      ) : (
        <FormLabel typo="13" bold>
          {label}
        </FormLabel>
      )}
      {children}
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
