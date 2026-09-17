"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { History, User, Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PriceHistoryEntry {
    id: string;
    hargaLama: number;
    hargaBaru: number;
    operator: string | null;
    keterangan: string | null;
    createdAt: string;
}

interface PriceHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    materialId: string;
    materialName: string;
    satuan: string;
}

export function PriceHistoryModal({
    isOpen,
    onClose,
    materialId,
    materialName,
    satuan,
}: PriceHistoryModalProps) {
    const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && materialId) {
            fetchHistory();
        }
    }, [isOpen, materialId]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/pt-pks/material/${materialId}/history`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (error) {
            console.error("Error fetching price history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Riwayat Harga: {materialName}
                    </DialogTitle>
                    <DialogDescription>
                        Daftar perubahan harga per {satuan} dari waktu ke waktu
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto py-4">
                    {isLoading ? (
                        <div className="py-12 text-center text-muted-foreground">
                            Memuat data riwayat...
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground border rounded-lg border-dashed">
                            Belum ada riwayat perubahan harga untuk produk ini.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Waktu</TableHead>
                                    <TableHead className="text-center">Perubahan Harga</TableHead>
                                    <TableHead>Operator</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.map((entry) => {
                                    const isIncrease = entry.hargaBaru > entry.hargaLama;
                                    const diff = entry.hargaBaru - entry.hargaLama;

                                    return (
                                        <TableRow key={entry.id}>
                                            <TableCell className="align-top">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium">
                                                        {new Date(entry.createdAt).toLocaleDateString("id-ID")}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(entry.createdAt).toLocaleTimeString("id-ID", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-muted-foreground line-through decoration-muted-foreground/50">
                                                            {formatCurrency(entry.hargaLama)}
                                                        </span>
                                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                        <span className="font-bold text-primary">
                                                            {formatCurrency(entry.hargaBaru)}
                                                        </span>
                                                    </div>
                                                    <Badge
                                                        variant={isIncrease ? "destructive" : "default"}
                                                        className={isIncrease ? "bg-red-100 text-red-700 hover:bg-red-100" : "bg-green-100 text-green-700 hover:bg-green-100"}
                                                    >
                                                        {isIncrease ? "+" : ""}{formatCurrency(diff)}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top">
                                                <div className="flex items-center gap-1 text-xs">
                                                    <User className="h-3 w-3" />
                                                    {entry.operator || "System"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top max-w-[200px]">
                                                <p className="text-xs truncate" title={entry.keterangan || "-"}>
                                                    {entry.keterangan || "-"}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
