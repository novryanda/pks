"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupplierMap } from "@/components/dashboard/pt-pks/supplier/supplier-map";
import { SupplierTable } from "@/components/dashboard/pt-pks/supplier/supplier-table";
import { SupplierForm } from "@/components/dashboard/pt-pks/supplier/supplier-form";
import { SupplierDetail } from "@/components/dashboard/pt-pks/supplier/supplier-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

type ViewMode = "list" | "detail" | "edit" | "create";

export default function SupplierPage() {
  const [activeTab, setActiveTab] = useState("suppliers");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const handleFormSuccess = () => {
    // Switch to suppliers tab after successful form submission
    setActiveTab("suppliers");
    setViewMode("list");
    setSelectedSupplierId(null);
  };

  const handleViewDetail = (id: string) => {
    setSelectedSupplierId(id);
    setViewMode("detail");
  };

  const handleEdit = (id: string) => {
    setSelectedSupplierId(id);
    setActiveTab("registration");
    setViewMode("edit");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedSupplierId(null);
    setActiveTab("suppliers");
  };

  const handleCreateNew = () => {
    setSelectedSupplierId(null);
    setViewMode("create");
    setActiveTab("registration");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Supplier TBS</h1>
        <p className="text-muted-foreground">
          Kelola data supplier TBS PT PKS
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="suppliers">Data Supplier</TabsTrigger>
          <TabsTrigger value="registration">
            {viewMode === "edit" ? "Edit Supplier" : "Registrasi Supplier"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          {viewMode === "detail" && selectedSupplierId ? (
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-4">
                <Button
                  variant="ghost"
                  onClick={handleBackToList}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Daftar
                </Button>
              </div>
              <SupplierDetail
                supplierId={selectedSupplierId}
                onClose={handleBackToList}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Peta Lokasi Supplier</h2>
                <SupplierMap />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold">Daftar Supplier</h2>
                  <Button onClick={handleCreateNew}>Tambah Supplier</Button>
                </div>
                <SupplierTable
                  onViewDetail={handleViewDetail}
                  onEdit={handleEdit}
                />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="registration">
          <div className="rounded-lg border bg-card p-6">
            {viewMode === "edit" && selectedSupplierId && (
              <div className="mb-4">
                <Button
                  variant="ghost"
                  onClick={handleBackToList}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Daftar
                </Button>
              </div>
            )}
            <h2 className="text-xl font-semibold mb-6">
              {viewMode === "edit"
                ? "Edit Supplier"
                : "Form Registrasi Supplier Baru"}
            </h2>
            <SupplierForm
              supplierId={selectedSupplierId || undefined}
              onSuccess={handleFormSuccess}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
