import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface DecimalNumericInputProps
  extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value?: number | null;
  onValueChange: (value: number) => void;
}

function formatIndonesianNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num) || num === 0) return "";
  const parts = num.toString().split(".");
  const intPart = parts[0]!.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (parts.length > 1) {
    return `${intPart},${parts[1]}`;
  }
  return intPart;
}

export function DecimalNumericInput({
  value,
  onValueChange,
  className,
  ...props
}: DecimalNumericInputProps) {
  const [displayValue, setDisplayValue] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);

  // Sync external value with displayValue when not focused
  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatIndonesianNumber(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    if (!raw || raw.trim() === "") {
      setDisplayValue("");
      onValueChange(0);
      return;
    }

    // Allow comma as decimal separator. If user typed comma, split by comma.
    const hasComma = raw.includes(",");
    const parts = raw.split(",");
    const rawInt = parts[0] || "";
    const rawDec = parts.length > 1 ? parts.slice(1).join("") : null;

    // Clean non-digits from integer part (this strips dots and any invalid characters)
    const cleanInt = rawInt.replace(/\D/g, "");
    const cleanDec = rawDec !== null ? rawDec.replace(/\D/g, "") : null;

    if (!cleanInt && rawDec === null) {
      setDisplayValue("");
      onValueChange(0);
      return;
    }

    // Format integer part with Indonesian dots for thousands
    const formattedInt = cleanInt
      ? cleanInt.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
      : (hasComma ? "0" : "");

    let nextDisplay = formattedInt;
    if (hasComma) {
      nextDisplay = `${formattedInt},${cleanDec || ""}`;
    }

    setDisplayValue(nextDisplay);

    // Parse numeric value for parent
    const numStr = cleanDec !== null && cleanDec !== ""
      ? `${cleanInt || "0"}.${cleanDec}`
      : (cleanInt || "0");

    const parsed = parseFloat(numStr);
    if (!isNaN(parsed)) {
      onValueChange(parsed);
    } else {
      onValueChange(0);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (displayValue === "" || displayValue === ",") {
      setDisplayValue("");
      onValueChange(0);
    } else {
      // Remove trailing comma on blur
      let cleanDisplay = displayValue;
      if (cleanDisplay.endsWith(",")) {
        cleanDisplay = cleanDisplay.slice(0, -1);
      }
      
      const numericStr = cleanDisplay.replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(numericStr);
      if (!isNaN(parsed)) {
        if (parsed === 0) {
          setDisplayValue("");
          onValueChange(0);
        } else {
          setDisplayValue(formatIndonesianNumber(parsed));
          onValueChange(parsed);
        }
      }
    }
    props.onBlur?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn("font-mono", className)}
    />
  );
}
