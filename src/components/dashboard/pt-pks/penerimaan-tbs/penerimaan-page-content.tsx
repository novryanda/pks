"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenerimaanBrutoWizard } from "./penerimaan-bruto-wizard";
import { PendingTarraList } from "./pending-tarra-list";
import { InputBongkarList } from "./input-bongkar-list";
import { Plus, Scale, Truck, FileText } from "lucide-react";
import { LaporanHasilTimbangan } from "./laporan-hasil-timbangan";

export function PenerimaanTBSPageContent() {
  const [activeTab, setActiveTab] = useState("input-baru");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleBrutoSaved = () => {
    handleRefresh();
    // Pindah ke tab menunggu tarra setelah simpan bruto
    setActiveTab("pending-tarra");
  };

  const handleTarraSaved = () => {
    handleRefresh();
    // Pindah ke tab input bongkar setelah simpan tarra
    setActiveTab("input-bongkar");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Penerimaan TBS</h1>
        <p className="text-muted-foreground">
          Kelola penerimaan TBS dari supplier - Input data bruto, tarra, dan bongkar
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="input-baru" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Input Bruto
          </TabsTrigger>
          <TabsTrigger value="pending-tarra" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Input Tarra
          </TabsTrigger>
          <TabsTrigger value="input-bongkar" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Input Bongkar
          </TabsTrigger>
          <TabsTrigger value="laporan" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Laporan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input-baru" className="mt-6">
          <PenerimaanBrutoWizard onSuccess={handleBrutoSaved} />
        </TabsContent>

        <TabsContent value="pending-tarra" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Input Timbang Tarra
              </CardTitle>
              <CardDescription>
                Pilih kendaraan yang sudah bongkar muatan untuk input timbangan tarra
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PendingTarraList key={`tarra-${refreshKey}`} onRefresh={handleTarraSaved} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="input-bongkar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Pilih Vendor Bongkar
              </CardTitle>
              <CardDescription>
                Pilih vendor bongkar dan rekening untuk penerimaan yang sudah selesai tarra
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InputBongkarList key={`bongkar-${refreshKey}`} onRefresh={handleRefresh} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="laporan" className="mt-6">
          <LaporanHasilTimbangan />
        </TabsContent>
      </Tabs>
    </div>
  );
}
