"use client";

import { useState, useMemo } from "react";
import { ProsesProduksiList } from "@/components/dashboard/pt-pks/proses-produksi/proses-produksi-list";
import { ProsesProduksiWizard } from "@/components/dashboard/pt-pks/proses-produksi/proses-produksi-wizard";
import { ProsesProduksiDetail } from "@/components/dashboard/pt-pks/proses-produksi/proses-produksi-detail";
import { ProsesProduksiSummary } from "@/components/dashboard/pt-pks/proses-produksi/proses-produksi-summary";

type ViewMode = "list" | "create" | "edit" | "detail";

export default function ProsesProduksiPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Date filter state - single date only (as per user request)
  const today = new Date().toISOString().split("T")[0] || "";
  const [filters, setFilters] = useState({
    tanggalMulai: today,
    tanggalAkhir: today,
    materialOutputId: "",
    status: "",
    filterMode: "single" as "single" | "range",
  });

  const handleCreateClick = () => {
    setSelectedId(null);
    setViewMode("create");
  };

  const handleEditClick = (id: string) => {
    setSelectedId(id);
    setViewMode("edit");
  };

  const handleViewClick = (id: string) => {
    setSelectedId(id);
    setViewMode("detail");
  };

  const handleSuccess = () => {
    setViewMode("list");
    setSelectedId(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setViewMode("list");
    setSelectedId(null);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {viewMode === "list" && (
        <>
          <ProsesProduksiSummary
            filters={filters}
            key={`summary-${refreshKey}`}
          />
          <ProsesProduksiList
            key={`list-${refreshKey}`}
            onCreateClick={handleCreateClick}
            onEditClick={handleEditClick}
            onViewClick={handleViewClick}
            onRefresh={handleRefresh}
            filters={filters}
            onFiltersChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
          />
        </>
      )}

      {(viewMode === "create" || viewMode === "edit") && (
        <ProsesProduksiWizard
          id={viewMode === "edit" ? selectedId || undefined : undefined}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}

      {viewMode === "detail" && selectedId && (
        <ProsesProduksiDetail
          id={selectedId}
          onBack={handleCancel}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
