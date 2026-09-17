import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

interface NumericInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
    value?: number | null;
    onValueChange: (value: number) => void;
    thousandSeparator?: string;
}

export function NumericInput({
    value,
    onValueChange,
    thousandSeparator = ".",
    className,
    ...props
}: NumericInputProps) {
    const [displayValue, setDisplayValue] = React.useState("");

    // Sync internal display state with prop value
    React.useEffect(() => {
        if (value === 0 || value === null || value === undefined || isNaN(value)) {
            setDisplayValue("");
        } else {
            // Avoid re-formatting if the numeric value matches what's already being displayed
            const currentNumeric = displayValue.replace(new RegExp(`\\${thousandSeparator}`, 'g'), "");
            if (currentNumeric !== value.toString()) {
                const formatted = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
                setDisplayValue(formatted);
            }
        }
    }, [value, thousandSeparator, displayValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Allow only digits and the separator
        const cleanValue = inputValue.replace(new RegExp(`[^0-9]`, 'g'), "");

        if (cleanValue === "") {
            setDisplayValue("");
            onValueChange(0);
            return;
        }

        const numericValue = parseInt(cleanValue, 10);
        if (!isNaN(numericValue)) {
            // Update display immediately for better UX
            const formatted = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
            setDisplayValue(formatted);
            onValueChange(numericValue);
        }
    };

    return (
        <Input
            {...props}
            type="text" // Use text to allow formatting
            inputMode="numeric" // Optimize for mobile keyboard
            value={displayValue}
            onChange={handleChange}
            className={cn("font-mono", className)} // Mono font usually better for numbers
        />
    );
}
