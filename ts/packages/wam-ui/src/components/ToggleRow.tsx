import { useId } from "react";
import { Text, Switch, HStack } from "@channel.io/bezier-react";
import styled from "styled-components";

export interface ToggleRowProps {
  /** Row label */
  label: string;
  /** Optional description below label */
  description?: string;
  /** Switch state */
  checked?: boolean;
  /** Change handler */
  onChange?: (checked: boolean) => void;
  /** Disable the switch */
  disabled?: boolean;
}

const LabelGroup = styled.label`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  cursor: pointer;
`;

export function ToggleRow({ label, description, checked, onChange, disabled }: ToggleRowProps) {
  const id = useId();

  return (
    <HStack justify="between" align="center" spacing={16}>
      <LabelGroup htmlFor={id}>
        <Text typo="14">{label}</Text>
        {description && (
          <Text typo="13" color="txt-black-dark">
            {description}
          </Text>
        )}
      </LabelGroup>
      <Switch id={id} size="m" checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </HStack>
  );
}
