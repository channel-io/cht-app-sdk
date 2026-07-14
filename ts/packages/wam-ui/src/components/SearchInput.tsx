import { useState, useRef, useCallback, useEffect } from "react";
import { TextField, Icon } from "@channel.io/bezier-react";
import { SearchIcon } from "@channel.io/bezier-icons";

export interface SearchInputProps {
  /** Controlled value */
  value?: string;
  /** Called with search string (after debounce if debounceMs > 0) */
  onChange?: (value: string) => void;
  placeholder?: string;
  /** Debounce delay in ms. 0 = immediate. Default 300. */
  debounceMs?: number;
  /** Show clear button. Default true. */
  allowClear?: boolean;
  /** Auto-focus on mount */
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  debounceMs = 300,
  allowClear = true,
  autoFocus = false,
}: SearchInputProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      if (!isControlled) {
        setInternalValue(newValue);
      }

      if (!onChange) {
        return;
      }

      if (isControlled || debounceMs === 0) {
        onChange(newValue);
        return;
      }

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        onChange(newValue);
        timerRef.current = null;
      }, debounceMs);
    },
    [isControlled, onChange, debounceMs]
  );

  const displayValue = isControlled ? value : internalValue;

  return (
    <TextField
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      variant="secondary"
      size="m"
      leftContent={<Icon source={SearchIcon} size="s" color="txt-black-darker" />}
      allowClear={allowClear}
      autoFocus={autoFocus}
    />
  );
}
