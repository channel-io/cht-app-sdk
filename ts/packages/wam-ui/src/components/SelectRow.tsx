import type { PropsWithChildren } from "react";
import { Select } from "@channel.io/bezier-react";
import { FormRow, type FormRowProps } from "./FormRow.js";

export interface SelectRowOption {
  label: string;
  value: string;
}

export interface SelectRowProps extends Omit<FormRowProps, "children">, PropsWithChildren {
  /** Selected display text */
  text?: string;
  /** Placeholder when no selection */
  placeholder?: string;
  /** Dropdown content (SelectTrigger is handled internally).
   *  Pass bezier `<ListItem>` elements as children for dropdown options.
   *
   * @example
   * ```tsx
   * <SelectRow label="Type" text={selected}>
   *   <ListItem content="Option A" onClick={() => setSelected("A")} />
   *   <ListItem content="Option B" onClick={() => setSelected("B")} />
   * </SelectRow>
   * ```
   */
  children?: React.ReactNode;
}

export function SelectRow({ text, placeholder, children, ...formRowProps }: SelectRowProps) {
  return (
    <FormRow {...formRowProps}>
      <Select text={text} placeholder={placeholder} size="m">
        {children}
      </Select>
    </FormRow>
  );
}
