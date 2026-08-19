import { useId } from "react";
import { formatNumberInput, parseNumberInput, stripNonNumeric } from "../lib/numbers";

interface NumberInputProps {
  value: number | string;
  onChange: (raw: string) => void;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

// Text-based number input: shows thousands separators (id-ID), blocks the
// scroll wheel from changing the value, and never allows a minus sign.
export default function NumberInput({ value, onChange, placeholder, required, min, max, style, ariaLabel }: NumberInputProps) {
  const id = useId();

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={formatNumberInput(value)}
      placeholder={placeholder}
      required={required}
      aria-label={ariaLabel}
      style={{
        width: "100%",
        padding: "12px 16px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.15)",
        background: "rgba(255,255,255,0.05)",
        color: "#fff",
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
        ...style,
      }}
      onChange={(e) => {
        const cleaned = stripNonNumeric(e.target.value);
        if (cleaned === "") {
          onChange("");
          return;
        }
        const num = parseNumberInput(cleaned);
        if (min !== undefined && num < min) {
          onChange(String(min));
          return;
        }
        if (max !== undefined && num > max) {
          onChange(String(max));
          return;
        }
        onChange(cleaned);
      }}
      onWheel={(e) => {
        // Prevent the browser from changing the value when scrolling.
        e.currentTarget.blur();
      }}
    />
  );
}
