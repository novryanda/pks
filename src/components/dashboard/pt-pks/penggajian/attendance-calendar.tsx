"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { 
  ATTENDANCE_CATEGORIES, 
  LEMBUR_TYPES, 
  calculateLemburBreakdown, 
  calculateTotalMenitDibayar,
  type LemburType 
} from "@/server/schema/penggajian";
import { Clock, X } from "lucide-react";

// Types
type LemburDetailItem = {
  type?: LemburType;
  hours?: number;
  x15: number;
  x2: number;
  x3: number;
  x4: number;
  keterangan?: string | null;
};

type LemburDetail = Record<string, LemburDetailItem | undefined>;
type TanggalKerja = Record<string, string | undefined>;

type AttendanceCalendarProps = {
  year: number;
  month: number;
  tanggalKerja: TanggalKerja;
  lemburDetail: LemburDetail;
  onAttendanceChange: (day: string, status: string | null) => void;
  onLemburChange: (day: string, lembur: LemburDetailItem | null) => void;
};

// Get color for attendance status
const getAttendanceColor = (code: string | undefined) => {
  if (!code) return "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700";
  
  const category = ATTENDANCE_CATEGORIES.find((c) => c.code === code);
  if (!category) return "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700";

  switch (category.color) {
    case "green":
      return "bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-200";
    case "blue":
      return "bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200";
    case "red":
      return "bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-200";
    case "cyan":
      return "bg-cyan-100 hover:bg-cyan-200 text-cyan-800 dark:bg-cyan-900 dark:hover:bg-cyan-800 dark:text-cyan-200";
    case "orange":
      return "bg-orange-100 hover:bg-orange-200 text-orange-800 dark:bg-orange-900 dark:hover:bg-orange-800 dark:text-orange-200";
    case "yellow":
      return "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:hover:bg-yellow-800 dark:text-yellow-200";
    case "gray":
      return "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200";
    case "purple":
      return "bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-200";
    default:
      return "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700";
  }
};

// Get day name
const getDayName = (year: number, month: number, day: number) => {
  const date = new Date(year, month - 1, day);
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  return days[date.getDay()];
};

// Check if it's weekend
const isWeekend = (year: number, month: number, day: number) => {
  const date = new Date(year, month - 1, day);
  return date.getDay() === 0 || date.getDay() === 6;
};

export function AttendanceCalendar({
  year,
  month,
  tanggalKerja,
  lemburDetail,
  onAttendanceChange,
  onLemburChange,
}: AttendanceCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [lemburDialogOpen, setLemburDialogOpen] = useState(false);
  const [tempLembur, setTempLembur] = useState<LemburDetailItem>({ 
    type: LEMBUR_TYPES.HARI_BIASA, 
    hours: 0, 
    x15: 0, 
    x2: 0, 
    x3: 0, 
    x4: 0, 
    keterangan: "" 
  });
  const [lemburHours, setLemburHours] = useState<number>(0);
  const [lemburType, setLemburType] = useState<LemburType>(LEMBUR_TYPES.HARI_BIASA);
  const [keterangan, setKeterangan] = useState<string>("");

  // Get number of days in month
  const daysInMonth = new Date(year, month, 0).getDate();

  // Update tempLembur when hours or type changes
  useEffect(() => {
    const breakdown = calculateLemburBreakdown(lemburHours, lemburType);
    setTempLembur({
      type: lemburType,
      hours: lemburHours,
      ...breakdown,
      keterangan,
    });
  }, [lemburHours, lemburType, keterangan]);

  // Handle attendance selection
  const handleAttendanceSelect = useCallback((day: string, code: string) => {
    onAttendanceChange(day, code);
  }, [onAttendanceChange]);

  // Handle clear attendance
  const handleClearAttendance = useCallback((day: string) => {
    onAttendanceChange(day, null);
  }, [onAttendanceChange]);

  // Open lembur dialog
  const openLemburDialog = useCallback((day: string) => {
    setSelectedDay(day);
    const existing = lemburDetail[day];
    if (existing) {
      // Use existing values
      const type = existing.type ?? LEMBUR_TYPES.HARI_BIASA;
      const hours = existing.hours ?? (existing.x15 + existing.x2 + existing.x3 + existing.x4) / 60;
      
      setLemburType(type);
      setLemburHours(hours);
      setKeterangan(existing.keterangan ?? "");
      setTempLembur(existing);
    } else {
      setLemburType(LEMBUR_TYPES.HARI_BIASA);
      setLemburHours(0);
      setKeterangan("");
      setTempLembur({ type: LEMBUR_TYPES.HARI_BIASA, hours: 0, x15: 0, x2: 0, x3: 0, x4: 0, keterangan: "" });
    }
    setLemburDialogOpen(true);
  }, [lemburDetail]);

  // Save lembur
  const saveLembur = useCallback(() => {
    if (selectedDay) {
      onLemburChange(selectedDay, tempLembur);
      setLemburDialogOpen(false);
      setSelectedDay(null);
      setLemburHours(0);
      setKeterangan("");
    }
  }, [selectedDay, tempLembur, onLemburChange]);

  // Calculate total lembur for a day
  const getDayLemburTotal = (day: string) => {
    const lembur = lemburDetail[day];
    if (!lembur) return 0;
    return lembur.x15 + lembur.x2 + lembur.x3 + lembur.x4;
  };

  const getDayPaidMinutes = (day: string) => {
    const lembur = lemburDetail[day];
    if (!lembur) return 0;
    return calculateTotalMenitDibayar(lembur);
  };

  const getDayInputHours = (day: string) => {
    const lembur = lemburDetail[day];
    if (!lembur) return 0;
    return lembur.hours ?? (lembur.x15 + lembur.x2 + lembur.x3 + lembur.x4) / 60;
  };

  const formatHours = (hours: number) => {
    const formattedHours = Number.isInteger(hours)
      ? String(hours)
      : hours.toFixed(1).replace(/\.0$/, "").replace(".", ",");

    return `${formattedHours}j`;
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
        <span className="text-sm font-medium mr-2">Keterangan:</span>
        {ATTENDANCE_CATEGORIES.map((cat) => (
          <Badge
            key={cat.code}
            variant="outline"
            className={cn("text-xs", getAttendanceColor(cat.code))}
          >
            {cat.code} = {cat.label}
          </Badge>
        ))}
      </div>

      {/* Calendar Grid */}
      <ScrollArea className="w-full">
        <div className="grid grid-cols-7 md:grid-cols-11 lg:grid-cols-16 gap-2 min-w-[700px] pb-2">
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = String(i + 1);
            const status = tanggalKerja[day];
            const hasLembur = getDayLemburTotal(day) > 0;
            const lembur = lemburDetail[day];
            const paidMinutes = getDayPaidMinutes(day);
            const inputHours = getDayInputHours(day);
            const weekend = isWeekend(year, month, i + 1);
            const dayName = getDayName(year, month, i + 1);

            return (
              <div key={day} className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-20 flex flex-col items-center justify-center p-1 relative gap-0.5",
                        getAttendanceColor(status),
                        weekend && !status && "bg-gray-50 dark:bg-gray-900"
                      )}
                    >
                      <span className="text-[10px] text-muted-foreground">{dayName}</span>
                      <span className="font-semibold">{day}</span>
                      <span className="text-xs font-medium">{status ?? "-"}</span>
                      {hasLembur && (
                        <span className="text-[10px] font-semibold text-orange-600 leading-none">
                          {paidMinutes}m dibayar
                        </span>
                      )}
                      {hasLembur && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 -right-1 h-4 px-1 text-[10px] bg-orange-500 text-white"
                        >
                          {formatHours(inputHours)}
                        </Badge>
                      )}
                      {lembur?.keterangan && (
                        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-blue-500 rounded-b" title={lembur.keterangan} />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">Tanggal {day}</span>
                        {status && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-red-500"
                            onClick={() => handleClearAttendance(day)}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Hapus
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {ATTENDANCE_CATEGORIES.map((cat) => (
                          <Button
                            key={cat.code}
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-8 text-xs px-1",
                              status === cat.code && "ring-2 ring-primary",
                              getAttendanceColor(cat.code)
                            )}
                            onClick={() => handleAttendanceSelect(day, cat.code)}
                          >
                            {cat.code}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => openLemburDialog(day)}
                      >
                        <Clock className="h-3 w-3 mr-2" />
                        Input Lembur
                        {hasLembur && (
                          <Badge variant="secondary" className="ml-2 bg-orange-500 text-white">
                            {getDayLemburTotal(day)}m
                          </Badge>
                        )}
                      </Button>
                      {lembur?.keterangan && (
                        <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded">
                          <strong>Ket:</strong> {lembur.keterangan}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Lembur Dialog */}
      <Dialog open={lemburDialogOpen} onOpenChange={setLemburDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Input Jam Lembur - Tanggal {selectedDay}</DialogTitle>
            <DialogDescription>
              Pilih jenis lembur dan masukkan jumlah jam lembur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Lembur Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Jenis Lembur</Label>
              <RadioGroup
                value={lemburType}
                onValueChange={(value: LemburType) => setLemburType(value)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value={LEMBUR_TYPES.HARI_BIASA} id="hari_biasa" />
                  <Label htmlFor="hari_biasa" className="flex-1 cursor-pointer">
                    <div className="font-medium">Lembur Hari Biasa</div>
                    <div className="text-xs text-muted-foreground">
                      1 jam pertama ×1.5, sisanya ×2
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value={LEMBUR_TYPES.HARI_LIBUR} id="hari_libur" />
                  <Label htmlFor="hari_libur" className="flex-1 cursor-pointer">
                    <div className="font-medium">Lembur Hari Libur</div>
                    <div className="text-xs text-muted-foreground">
                      7 jam pertama ×2, jam 8 ×3, jam 9+ ×4
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value={LEMBUR_TYPES.HARI_BESAR} id="hari_besar" />
                  <Label htmlFor="hari_besar" className="flex-1 cursor-pointer">
                    <div className="font-medium">Lembur Hari Besar (Nasional)</div>
                    <div className="text-xs text-muted-foreground">
                      1 jam pertama ×3, sisanya ×4
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Hours Input */}
            <div className="space-y-2">
              <Label htmlFor="lemburHours">Jumlah Jam Lembur</Label>
              <Input
                id="lemburHours"
                type="number"
                min="0"
                step="0.5"
                value={lemburHours || ""}
                onChange={(e) => setLemburHours(parseFloat(e.target.value) || 0)}
                placeholder="Contoh: 1, 1.5, 2, 2.5"
                className="text-lg"
              />
              <div className="text-xs text-muted-foreground">
                Masukkan dalam jam (gunakan 0.5 untuk setengah jam)
              </div>
            </div>

            {/* Keterangan Input */}
            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
              <Textarea
                id="keterangan"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Lembur project X, Maintenance server, dll."
                rows={2}
              />
            </div>

            {/* Preview Calculation */}
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="font-medium text-sm">Rincian Perhitungan:</div>
              
              {lemburType === LEMBUR_TYPES.HARI_BIASA && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Jam pertama (60 menit) × 1.5:</span>
                    <span className="font-medium">{tempLembur.x15} menit → {Math.round(tempLembur.x15 * 1.5)} menit</span>
                  </div>
                  {tempLembur.x2 > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Sisa ({tempLembur.x2} menit) × 2:</span>
                      <span className="font-medium">{tempLembur.x2} menit → {tempLembur.x2 * 2} menit</span>
                    </div>
                  )}
                </>
              )}

              {lemburType === LEMBUR_TYPES.HARI_LIBUR && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>7 jam pertama × 2:</span>
                    <span className="font-medium">{tempLembur.x2} menit → {tempLembur.x2 * 2} menit</span>
                  </div>
                  {tempLembur.x3 > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Jam ke-8 × 3:</span>
                      <span className="font-medium">{tempLembur.x3} menit → {tempLembur.x3 * 3} menit</span>
                    </div>
                  )}
                  {tempLembur.x4 > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Jam ke-9+ × 4:</span>
                      <span className="font-medium">{tempLembur.x4} menit → {tempLembur.x4 * 4} menit</span>
                    </div>
                  )}
                </>
              )}

              {lemburType === LEMBUR_TYPES.HARI_BESAR && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Jam pertama × 3:</span>
                    <span className="font-medium">{tempLembur.x3} menit → {tempLembur.x3 * 3} menit</span>
                  </div>
                  {tempLembur.x4 > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Sisa × 4:</span>
                      <span className="font-medium">{tempLembur.x4} menit → {tempLembur.x4 * 4} menit</span>
                    </div>
                  )}
                </>
              )}

              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span>Total Menit Aktual:</span>
                  <span className="font-medium">
                    {tempLembur.x15 + tempLembur.x2 + tempLembur.x3 + tempLembur.x4} menit ({lemburHours} jam)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Menit Dibayar:</span>
                  <span className="font-semibold text-orange-600">
                    {calculateTotalMenitDibayar(tempLembur)} menit
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLemburDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={saveLembur}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
