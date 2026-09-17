"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { getJakartaDateKey } from "@/lib/date-time";
import { RotateCcw, Calendar, CalendarRange } from "lucide-react";

export type DateFilterModeType = "single" | "range";

interface DateFilterModeProps {
  mode: DateFilterModeType;
  singleDate: string;
  startDate: string;
  endDate: string;
  onModeChange: (mode: DateFilterModeType) => void;
  onSingleDateChange: (date: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onReset?: () => void;
  showResetButton?: boolean;
  className?: string;
  /** Restrict which modes are available. If only one mode, toggle is hidden */
  allowedModes?: DateFilterModeType[];
}

export function DateFilterMode({
  mode,
  singleDate,
  startDate,
  endDate,
  onModeChange,
  onSingleDateChange,
  onStartDateChange,
  onEndDateChange,
  onReset,
  showResetButton = true,
  className = "",
  allowedModes = ["single", "range"],
}: DateFilterModeProps) {
  const today = getJakartaDateKey(new Date()) || "";

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      onSingleDateChange(today);
      onStartDateChange(today);
      onEndDateChange(today);
      onModeChange("single");
    }
  };

  // Check if both modes are allowed
  const showModeToggle = allowedModes.length > 1;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Mode Selection - only show if both modes allowed */}
      {showModeToggle && (
        <div className="flex items-center gap-4">
          <Label className="text-sm font-semibold whitespace-nowrap">
            Filter Tanggal:
          </Label>
          <RadioGroup
            value={mode}
            onValueChange={(value) => onModeChange(value as DateFilterModeType)}
            className="flex items-center gap-4"
          >
            {allowedModes.includes("single") && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label
                  htmlFor="single"
                  className="flex cursor-pointer items-center gap-1 text-sm"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Tanggal Tunggal
                </Label>
              </div>
            )}
            {allowedModes.includes("range") && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="range" id="range" />
                <Label
                  htmlFor="range"
                  className="flex cursor-pointer items-center gap-1 text-sm"
                >
                  <CalendarRange className="h-3.5 w-3.5" />
                  Periode
                </Label>
              </div>
            )}
          </RadioGroup>
        </div>
      )}

      {/* Date Inputs */}
      <div className="flex flex-wrap items-end gap-3">
        {mode === "single" ? (
          <div className="space-y-1.5">
            <Label
              htmlFor="single-date"
              className="text-muted-foreground text-xs"
            >
              Pilih Tanggal
            </Label>
            <Input
              id="single-date"
              type="date"
              className="h-9 w-[180px]"
              value={singleDate}
              onChange={(e) => onSingleDateChange(e.target.value)}
            />
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label
                htmlFor="start-date"
                className="text-muted-foreground text-xs"
              >
                Dari Tanggal
              </Label>
              <Input
                id="start-date"
                type="date"
                className="h-9 w-[160px]"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => onStartDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="end-date"
                className="text-muted-foreground text-xs"
              >
                Sampai Tanggal
              </Label>
              <Input
                id="end-date"
                type="date"
                className="h-9 w-[160px]"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => onEndDateChange(e.target.value)}
              />
            </div>
          </>
        )}

        {showResetButton && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="h-9 w-9 shrink-0"
            title="Reset Filter"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper hook for managing date filter state
export function useDateFilterState(defaultDate?: string) {
  const today = defaultDate || getJakartaDateKey(new Date()) || "";

  return {
    initialState: {
      mode: "single" as DateFilterModeType,
      singleDate: today,
      startDate: today,
      endDate: today,
    },
    getEffectiveDates: (state: {
      mode: DateFilterModeType;
      singleDate: string;
      startDate: string;
      endDate: string;
    }) => {
      if (state.mode === "single") {
        return {
          startDate: state.singleDate,
          endDate: state.singleDate,
        };
      }
      return {
        startDate: state.startDate,
        endDate: state.endDate,
      };
    },
  };
}
