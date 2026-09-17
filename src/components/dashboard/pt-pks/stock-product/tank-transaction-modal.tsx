"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TangkiDetail {
  id: string;
  namaTangki: string;
  kapasitas: number;
  isiPadaTanggal: number;
  materialId: string;
  material: {
    id: string;
    name: string;
    satuan: {
      symbol: string;
    };
  };
}

interface TankTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tangki: TangkiDetail;
  allTangkis?: TangkiDetail[];
  filterDate: string;
  netBalance: number;
  totalInTanks: number;
}

export function TankTransactionModal({
  isOpen,
  onClose,
  tangki,
  allTangkis = [],
  filterDate,
  netBalance,
  totalInTanks,
}: TankTransactionModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [stockMaterial, setStockMaterial] = useState<number>(0);

  // Masuk form state
  const [masukJumlah, setMasukJumlah] = useState<number | null>(null);
  const [masukKeterangan, setMasukKeterangan] = useState("");

  // Transfer form state
  const [transferTangkiTujuanId, setTransferTangkiTujuanId] = useState("");
  const [transferJumlah, setTransferJumlah] = useState<number | null>(null);
  const [transferKeterangan, setTransferKeterangan] = useState("");

  const availableTangkisForTransfer = allTangkis.filter(
    (t: any) => t.id !== tangki.id &&
      (t.material?.name || t.materialName) === (tangki.material?.name || (tangki as any).materialName),
  );

  // Calculate total stock for this material across all tanks
  const totalStockForMaterial = allTangkis
    .filter((t: any) => (t.material?.name || t.materialName) === (tangki.material?.name || (tangki as any).materialName))
    .reduce((sum, t: any) => sum + (t.isiPadaTanggal || 0), 0);

  // Fetch stock material from StockMaterial table
  useEffect(() => {
    if (isOpen && tangki.material) {
      fetchStockMaterial();
    }
  }, [isOpen, tangki.material]);

  const fetchStockMaterial = async () => {
    try {
      const response = await fetch(
        `/api/pt-pks/stock-material?materialId=${tangki.material.id}`,
      );
      if (response.ok) {
        const data = await response.json();
        setStockMaterial(data.jumlah || 0);
      }
    } catch (error) {
      console.error("Error fetching stock material:", error);
    }
  };

  const handleMasuk = async () => {
    if (masukJumlah === null || masukJumlah <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }

    const currentLevel = (tangki.isiPadaTanggal || 0);
    const sisaKapasitas = (tangki.kapasitas || 0) - currentLevel;
    if (masukJumlah > sisaKapasitas) {
      toast.error(`Kapasitas tangki tidak mencukupi. Sisa kapasitas: ${sisaKapasitas.toLocaleString("id-ID")}`);
      return;
    }

    if (masukJumlah + totalInTanks > netBalance + 0.01) {
      toast.error("jumlah yang anda masuki melebihi jumlah stok produksi saat ini");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/pt-pks/tangki/stock/masuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tangkiId: tangki.id,
          jumlah: masukJumlah,
          keterangan: masukKeterangan,
          tanggalTransaksi: filterDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menambah stock");
      }

      toast.success("Stock berhasil ditambahkan");
      router.refresh();
      onClose();
      resetForms();
    } catch (err) {
      console.error("Error Adding Stock:", err);
      toast.error(err instanceof Error ? err.message : "Gagal menambah stock");
    } finally {
      setIsLoading(false);
    }
  };



  const handleTransfer = async () => {
    if (!transferTangkiTujuanId) {
      toast.error("Pilih tangki tujuan");
      return;
    }

    if (transferJumlah === null || transferJumlah <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }

    const currentStock = (tangki.isiPadaTanggal || 0);
    if (transferJumlah > currentStock) {
      toast.error(`Stock tidak mencukupi. Stock tersedia: ${currentStock.toLocaleString("id-ID")}`);
      return;
    }

    // New Validation: Check destination tank capacity
    const destinationTank = allTangkis.find((t) => t.id === transferTangkiTujuanId);
    if (destinationTank) {
      const destinationCurrentLevel = destinationTank.isiPadaTanggal || 0;
      const destinationCapacity = destinationTank.kapasitas || 0;
      const destinationRemainingCapacity = destinationCapacity - destinationCurrentLevel;

      if (transferJumlah > destinationRemainingCapacity) {
        toast.error("kapasitas tangki yang anda transfer tidak mencukupi");
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/pt-pks/tangki/stock/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tangkiAsalId: tangki.id,
          tangkiTujuanId: transferTangkiTujuanId,
          jumlah: transferJumlah,
          keterangan: transferKeterangan,
          tanggalTransaksi: filterDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal transfer stock");
      }

      toast.success("Transfer stock berhasil");
      router.refresh();
      onClose();
      resetForms();
    } catch (err) {
      console.error("Error Transferring Stock:", err);
      toast.error(err instanceof Error ? err.message : "Gagal transfer stock");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForms = () => {
    setMasukJumlah(null);
    setMasukKeterangan("");
    setTransferTangkiTujuanId("");
    setTransferJumlah(null);
    setTransferKeterangan("");
  };

  const currentLevel = (tangki.isiPadaTanggal || 0);
  const unitSymbol = tangki.material?.satuan?.symbol || (tangki as any).satuan || "kg";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Distribusi Saldo Produksi - {tangki.namaTangki}</DialogTitle>
          <DialogDescription>
            Input jumlah material hasil produksi yang dialokasikan ke tangki ini pada tanggal tersebut.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 text-sm text-muted-foreground -mt-2 mb-4">
          <div>Material: <strong>{tangki.material?.name || (tangki as any).materialName}</strong></div>
          <div>Tanggal Filter: <strong>{new Date(filterDate).toLocaleDateString("id-ID")}</strong></div>
          <div className="border-t pt-2 mt-2">
            <span className="font-semibold text-blue-600">
              Produksi Tersedia (Maksimal): {netBalance.toLocaleString("id-ID")}{" "}
              {unitSymbol}
            </span>
          </div>
          <div className="border-t pt-2 mt-2">
            Sudah Dialokasikan Hari Ini (Total): {totalInTanks.toLocaleString("id-ID")} {unitSymbol}
          </div>
          <div className="border-t pt-2 mt-2">
            Isi Tangki Ini (Harian): {currentLevel.toLocaleString("id-ID")} {unitSymbol}
          </div>
        </div>

        <Tabs defaultValue="masuk" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="masuk">Stock Masuk</TabsTrigger>
            <TabsTrigger value="transfer">Transfer</TabsTrigger>
          </TabsList>

          {/* STOCK MASUK */}
          <TabsContent value="masuk" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="masuk-jumlah">
                Jumlah ({unitSymbol}) *
              </Label>
              <NumericInput
                id="masuk-jumlah"
                value={masukJumlah}
                onValueChange={setMasukJumlah}
                step={0.01}
                placeholder="0"
              />
              <p className="text-sm text-muted-foreground">
                Sisa kapasitas: {((tangki.kapasitas || 0) - currentLevel).toLocaleString("id-ID")}{" "}
                {unitSymbol}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="masuk-keterangan">Keterangan</Label>
              <Textarea
                id="masuk-keterangan"
                value={masukKeterangan}
                onChange={(e) => setMasukKeterangan(e.target.value)}
                placeholder="Keterangan alokasi hasil produksi"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Batal
              </Button>
              <Button onClick={handleMasuk} disabled={isLoading}>
                {isLoading ? "Memproses..." : "Simpan Stock Masuk"}
              </Button>
            </DialogFooter>
          </TabsContent>



          {/* TRANSFER */}
          <TabsContent value="transfer" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-tujuan">Tangki Tujuan *</Label>
              <Select
                value={transferTangkiTujuanId}
                onValueChange={setTransferTangkiTujuanId}
              >
                <SelectTrigger id="transfer-tujuan">
                  <SelectValue placeholder="Pilih tangki tujuan" />
                </SelectTrigger>
                <SelectContent>
                  {availableTangkisForTransfer.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.namaTangki} - {(t.isiPadaTanggal || 0).toLocaleString("id-ID")} /{" "}
                      {(t.kapasitas || 0).toLocaleString("id-ID")}{" "}
                      {t.material?.satuan?.symbol || t.satuan || unitSymbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableTangkisForTransfer.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Tidak ada tangki dengan material yang sama
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-jumlah">
                Jumlah ({unitSymbol}) *
              </Label>
              <NumericInput
                id="transfer-jumlah"
                value={transferJumlah}
                onValueChange={setTransferJumlah}
                step={0.01}
                placeholder="0"
              />
              <p className="text-sm text-muted-foreground">
                Stock tersedia: {currentLevel.toLocaleString("id-ID")}{" "}
                {unitSymbol}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-keterangan">Keterangan</Label>
              <Textarea
                id="transfer-keterangan"
                value={transferKeterangan}
                onChange={(e) => setTransferKeterangan(e.target.value)}
                placeholder="Keterangan transfer"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Batal
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={isLoading || availableTangkisForTransfer.length === 0}
              >
                {isLoading ? "Memproses..." : "Transfer Stock"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
