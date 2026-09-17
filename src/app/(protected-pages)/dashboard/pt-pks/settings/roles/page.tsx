"use client";

import { useState } from "react";
import { ModuleAccessGuard } from "@/components/dashboard/module-access-guard";
import { RoleTable } from "@/components/dashboard/pt-pks/settings/role-table";
import { RoleForm } from "@/components/dashboard/pt-pks/settings/role-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type ViewMode = "list" | "create" | "edit";

export default function RolesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const handleFormSuccess = () => {
    setViewMode("list");
    setSelectedRoleId(null);
  };

  const handleEdit = (id: string) => {
    setSelectedRoleId(id);
    setViewMode("edit");
  };

  const handleAdd = () => {
    setSelectedRoleId(null);
    setViewMode("create");
  };

  const handleCancel = () => {
    setViewMode("list");
    setSelectedRoleId(null);
  };

  return (
    <ModuleAccessGuard module="settings.roles">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Role & Permissions</h1>
          <p className="text-muted-foreground">
            Kelola role dan hak akses user
          </p>
        </div>

        {viewMode === "list" ? (
          <RoleTable onEdit={handleEdit} onAdd={handleAdd} />
        ) : (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Daftar
            </Button>
            <RoleForm
              roleId={viewMode === "edit" ? selectedRoleId ?? undefined : undefined}
              onSuccess={handleFormSuccess}
              onCancel={handleCancel}
            />
          </div>
        )}
      </div>
    </ModuleAccessGuard>
  );
}
