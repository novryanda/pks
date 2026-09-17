"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceForm } from "./invoice-form";
import { InvoiceListView } from "./invoice-list-view";
import { Plus, ListOrdered } from "lucide-react";

export function InvoicePageContent() {
  const [activeTab, setActiveTab] = useState("buat-invoice");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleInvoiceCreated = () => {
    handleRefresh();
    setActiveTab("daftar-invoice");
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-10">
          <TabsTrigger value="buat-invoice" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Buat Invoice</span>
          </TabsTrigger>
          <TabsTrigger value="daftar-invoice" className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4" />
            <span>Daftar Invoice</span>
          </TabsTrigger>
        </TabsList>

        {/* Info Section */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">ℹ️ Informasi Invoice Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">
                Modul ini digunakan untuk membuat dan mengelola invoice berdasarkan kontrak buyer.
                Invoice dapat dicetak tanpa perlu menunggu status pengiriman product.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Pilih buyer terlebih dahulu</li>
                <li>Pilih kontrak yang ingin di-invoice</li>
                <li>Input klaim mutu dan klaim susut jika ada</li>
                <li>Input pajak PPN dan PPh</li>
                <li>Cetak invoice dalam format PDF</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="buat-invoice" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Buat Invoice Baru</CardTitle>
              <CardDescription>
                Pilih buyer dan kontrak untuk membuat invoice baru. 
                Anda dapat memasukkan klaim mutu, klaim susut, dan pajak.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceForm 
                key={`form-${refreshKey}`} 
                onSuccess={handleInvoiceCreated} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daftar-invoice" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Invoice</CardTitle>
              <CardDescription>
                Kelola invoice yang sudah dibuat. Terbitkan invoice, input pembayaran, atau batalkan invoice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceListView 
                key={`list-${refreshKey}`} 
                onRefresh={handleRefresh} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
