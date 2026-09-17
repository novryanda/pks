"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PengirimanWizard } from "./pengiriman-wizard";
import { PendingGrossList } from "./pending-gross-list";
import { PendingMutuList } from "./pending-mutu-list";
import { PendingKontrakList } from "./pending-kontrak-list";
import { Plus, Scale, Beaker, FileText } from "lucide-react";

type PengirimanPageContentProps = {
  onRefresh?: () => void;
};

export function PengirimanPageContent({ onRefresh }: PengirimanPageContentProps) {
  const [activeTab, setActiveTab] = useState("input-baru");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    onRefresh?.();
  };

  const handleTarraSaved = () => {
    handleRefresh();
    // Pindah ke tab menunggu gross setelah simpan tarra
    setActiveTab("pending-gross");
  };

  const handleGrossSaved = () => {
    handleRefresh();
    // Pindah ke tab input mutu setelah simpan gross
    setActiveTab("pending-mutu");
  };

  const handleMutuSaved = () => {
    handleRefresh();
    // Pindah ke tab pilih kontrak setelah simpan mutu
    setActiveTab("pending-kontrak");
  };

  const handleKontrakSaved = () => {
    handleRefresh();
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>

        <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-auto min-w-full">
            <TabsTrigger value="input-baru" className="flex items-center gap-2 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              <span>Input Baru</span>
            </TabsTrigger>
            <TabsTrigger value="pending-gross" className="flex items-center gap-2 whitespace-nowrap">
              <Scale className="h-4 w-4" />
              <span>Timbang Gross</span>
            </TabsTrigger>
            <TabsTrigger value="pending-mutu" className="flex items-center gap-2 whitespace-nowrap">
              <Beaker className="h-4 w-4" />
              <span>Input Mutu</span>
            </TabsTrigger>
            <TabsTrigger value="pending-kontrak" className="flex items-center gap-2 whitespace-nowrap">
              <FileText className="h-4 w-4" />
              <span>Pilih Kontrak</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Alur Info */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">ℹ️ Alur Pengiriman Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                <div>
                  <div className="font-semibold">Vendor & Tarra</div>
                  <div className="text-xs text-muted-foreground leading-tight">Pilih vendor, timbang tarra</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                <div>
                  <div className="font-semibold">Timbang Gross</div>
                  <div className="text-xs text-muted-foreground leading-tight">Setelah loading produk</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                <div>
                  <div className="font-semibold">Input Mutu</div>
                  <div className="text-xs text-muted-foreground leading-tight">Kualitas & Custom Fields</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">4</div>
                <div>
                  <div className="font-semibold">Pilih Kontrak</div>
                  <div className="text-xs text-muted-foreground leading-tight">Buyer & kontrak tujuan</div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Untuk membuat invoice, gunakan menu <strong>Pemasaran → Invoice</strong>
            </p>
          </CardContent>
        </Card>

        <TabsContent value="input-baru" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Input Pengiriman Baru - Tahap 1</CardTitle>
              <CardDescription>
                Pilih vendor transportir dan lakukan penimbangan tarra (truck kosong).
                Setelah disimpan, kendaraan dapat melanjutkan loading produk.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PengirimanWizard onSuccess={handleTarraSaved} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending-gross" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Timbang Gross - Tahap 2</CardTitle>
              <CardDescription>
                Daftar pengiriman yang sudah selesai timbangan tarra dan menunggu input timbangan gross.
                Klik pada item untuk melanjutkan proses penimbangan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PendingGrossList key={`gross-${refreshKey}`} onRefresh={handleGrossSaved} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending-mutu" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Input Mutu - Tahap 3</CardTitle>
              <CardDescription>
                Daftar pengiriman yang sudah selesai timbangan gross dan menunggu input data mutu produk.
                Pilih kontrak untuk menarik parameter mutu yang dibutuhkan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PendingMutuList key={`mutu-${refreshKey}`} onRefresh={handleMutuSaved} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending-kontrak" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pilih Kontrak - Tahap 4</CardTitle>
              <CardDescription>
                Daftar pengiriman yang sudah selesai input mutu dan menunggu pemilihan kontrak buyer.
                Jika kapasitas kontrak tidak mencukupi, Anda dapat membuat kontrak baru.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PendingKontrakList key={`kontrak-${refreshKey}`} onRefresh={handleKontrakSaved} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
