"use client";

import { useCallback, useEffect, useState } from "react";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, Users, FileSpreadsheet } from "lucide-react";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

type PermissionValue = boolean | PermissionTree;

interface PermissionTree {
  [key: string]: PermissionValue;
}

type Role = {
  id: string;
  name: string;
  description: string | null;
  companyId: string;
  permissions: PermissionTree | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
  };
};

type RolesResponse = {
  roles?: Role[];
};

type ApiErrorResponse = {
  error?: string;
  message?: string;
};

type RoleTableProps = {
  initialData?: Role[];
  onEdit: (id: string) => void;
  onAdd: () => void;
};

export function RoleTable({ initialData = [], onEdit, onAdd }: RoleTableProps) {
  const { hasActionAccess } = useUserPermissions();
  const [roles, setRoles] = useState<Role[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/pt-pks/role");
      if (!response.ok) throw new Error("Failed to fetch roles");

      const result = (await response.json()) as RolesResponse;
      setRoles(result.roles ?? []);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  const handleDelete = (role: Role) => {
    setSelectedRole(role);
    setDeleteError("");
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/pt-pks/role/${selectedRole.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = (await response.json()) as ApiErrorResponse;
        throw new Error(error.error ?? error.message ?? "Failed to delete role");
      }

      // Refresh data
      await fetchRoles();
      setDeleteDialogOpen(false);
      setSelectedRole(null);
      setDeleteError("");
    } catch (error) {
      console.error("Error deleting role:", error);
      setDeleteError(error instanceof Error ? error.message : "Failed to delete role");
    }
  };

  const countPermissions = (permissions: PermissionTree | null): number => {
    if (!permissions) return 0;
    let count = 0;
    
    const countInObject = (obj: PermissionTree) => {
      for (const key in obj) {
        const value = obj[key];
        if (typeof value === "boolean" && value) {
          count++;
        } else if (value && typeof value === "object") {
          countInObject(value);
        }
      }
    };
    
    countInObject(permissions);
    return count;
  };

  const isProtectedRole = (roleName: string) =>
    roleName === "Admin" || roleName === "Super Admin";

  const handleExportExcel = () => {
    if (roles.length === 0) {
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Nama Role", key: "name", width: 25 },
      { header: "Deskripsi", key: "description", width: 35 },
      { header: "Jumlah User", key: "userCount", width: 15 },
      { header: "Permission Aktif", key: "permissionCount", width: 18 },
    ];

    const dataToExport = roles.map((r) => ({
      name: r.name,
      description: r.description || "-",
      userCount: (r as any)._count?.users ?? 0,
      permissionCount: countPermissions(r.permissions),
    }));

    exportToExcel(dataToExport, columns, `Data_Role_${new Date().toISOString().split("T")[0]}`, "Roles");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleExportExcel} disabled={roles.length === 0}>
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          Export Excel
        </Button>
        {hasActionAccess("settings.roles", "create") && (
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Role
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Role</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Jumlah User</TableHead>
              <TableHead>Permission Aktif</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Tidak ada data role
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <Badge variant={isProtectedRole(role.name) ? "default" : "secondary"}>
                      {role.name}
                    </Badge>
                  </TableCell>
                  <TableCell>{role.description || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{role._count.users}</span>
                    </div>
                  </TableCell>
                  <TableCell>{countPermissions(role.permissions)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(role.id)}
                        title="Edit"
                        disabled={!hasActionAccess("settings.roles", "edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(role)}
                        title="Hapus"
                        disabled={isProtectedRole(role.name) || !hasActionAccess("settings.roles", "delete")}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Role</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus role{" "}
              <span className="font-semibold">{selectedRole?.name}</span>?
              {selectedRole && selectedRole._count.users > 0 && (
                <span className="block mt-2 text-destructive">
                  Perhatian: Role ini masih memiliki {selectedRole._count.users} user.
                  Anda harus memindahkan user ke role lain terlebih dahulu.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {deleteError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
