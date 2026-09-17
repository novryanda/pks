"use client";

import { useState } from "react";
import { UserTable } from "@/components/dashboard/pt-pks/settings/user-table";
import { UserForm } from "@/components/dashboard/pt-pks/settings/user-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type ViewMode = "list" | "create" | "edit";

export default function UsersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleFormSuccess = () => {
    setViewMode("list");
    setSelectedUserId(null);
  };

  const handleEdit = (id: string) => {
    setSelectedUserId(id);
    setViewMode("edit");
  };

  const handleAdd = () => {
    setSelectedUserId(null);
    setViewMode("create");
  };

  const handleCancel = () => {
    setViewMode("list");
    setSelectedUserId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen User</h1>
        <p className="text-muted-foreground">
          Kelola user dan akses sistem
        </p>
      </div>

      {viewMode === "list" ? (
        <UserTable onEdit={handleEdit} onAdd={handleAdd} />
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
          <UserForm
            userId={viewMode === "edit" ? selectedUserId ?? undefined : undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleCancel}
          />
        </div>
      )}
    </div>
  );
}
