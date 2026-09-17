"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";
import type { Permission } from "@/server/schema/user";

// Schema for form validation
const roleFormSchema = z.object({
  name: z.string().min(1, "Nama role harus diisi"),
  description: z.string().optional(),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

type RoleFormProps = {
  roleId?: string;
  onSuccess: () => void;
  onCancel: () => void;
};

// Permission structure labels in Indonesian
const permissionLabels = {
  masterData: {
    label: "Master Data",
    modules: {
      supplier: "Supplier",
      buyer: "Buyer",
      driver: "Driver/Transportir",
      material: "Material",
      vendor: "Vendor Transport",
      vendorMaterial: "Vendor Material",
      vendorBongkar: "Vendor Bongkar",
      karyawan: "Karyawan",
    },
  },
  supplyChain: {
    label: "Supply Chain",
    modules: {
      penerimaanTbs: "Penerimaan TBS",
      inputHargaTbs: "Input Harga TBS",
      pembayaranSupplier: "Pembayaran Supplier",
    },
  },
  produksi: {
    label: "Produksi",
    modules: {
      dashboard: "Dashboard Produksi",
      prosesProduksi: "Proses Produksi",
      laporanHarian: "Laporan Harian",
    },
  },
  gudang: {
    label: "Gudang",
    modules: {
      stockTbs: "Stock TBS",
      stockProduct: "Stock Product",
      stockMovement: "Stock Movement",
      stockAwal: "Stock Awal",
      inventaris: "Inventaris",
      storeRequest: "Store Request (SR)",
      purchaseRequest: "Purchase Request (PR)",
      biayaOperasional: "Biaya Operasional",
      purchaseOrder: "Purchase Order (PO)",
      penerimaanBarang: "Penerimaan Barang",
      pengeluaranBarang: "Pengeluaran Barang",
    },
  },
  pemasaran: {
    label: "Pemasaran",
    modules: {
      pengirimanProduct: "Pengiriman Product",
      hargaTransportir: "Harga Transportir",
      riwayatPengiriman: "Riwayat Pengiriman",
      contract: "Kontrak",
      invoice: "Invoice",
    },
  },
  payroll: {
    label: "Payroll",
    modules: {
      penggajian: "Penggajian",
    },
  },
  keuangan: {
    label: "Keuangan",
    modules: {
      hutangSupplier: "Hutang Supplier",
      upahBongkar: "Upah Bongkar",
      pembayaranTransportir: "Pembayaran Transportir",
      pembayaranPr: "Pembayaran PR",
      pembayaranPo: "Pembayaran PO",
      biayaPengeluaran: "Biaya Pengeluaran",
      piutangCustomer: "Piutang Customer",
      neraca: "Neraca",
    },
  },
  settings: {
    label: "Pengaturan",
    modules: {
      users: "Users",
      roles: "Roles & Permissions",
      companies: "Companies",
      reports: "Reports",
    },
  },
};

const actionLabels = {
  view: "Lihat",
  create: "Tambah",
  edit: "Edit",
  delete: "Hapus",
  approve: "Approve",
};

// Default empty permissions
const getEmptyPermissions = (): Permission => ({
  masterData: {
    supplier: { view: false, create: false, edit: false, delete: false },
    buyer: { view: false, create: false, edit: false, delete: false },
    driver: { view: false, create: false, edit: false, delete: false },
    material: { view: false, create: false, edit: false, delete: false },
    vendor: { view: false, create: false, edit: false, delete: false },
    vendorMaterial: { view: false, create: false, edit: false, delete: false },
    karyawan: { view: false, create: false, edit: false, delete: false },
    vendorBongkar: { view: false, create: false, edit: false, delete: false },
  },
  supplyChain: {
    penerimaanTbs: { view: false, create: false, edit: false, delete: false },
    inputHargaTbs: { view: false, create: false, edit: false, delete: false },
    pembayaranSupplier: { view: false, create: false, edit: false, delete: false },
  },
  produksi: {
    dashboard: { view: false, create: false, edit: false, delete: false },
    prosesProduksi: { view: false, create: false, edit: false, delete: false },
    laporanHarian: { view: false, create: false, edit: false, delete: false },
  },
  gudang: {
    stockTbs: { view: false, create: false, edit: false, delete: false },
    stockProduct: { view: false, create: false, edit: false, delete: false },
    stockMovement: { view: false, create: false, edit: false, delete: false },
    stockAwal: { view: false, create: false, edit: false, delete: false },
    inventaris: { view: false, create: false, edit: false, delete: false },
    storeRequest: { view: false, create: false, edit: false, delete: false, approve: false },
    purchaseRequest: { view: false, create: false, edit: false, delete: false, approve: false },
    biayaOperasional: { view: false, create: false, edit: false, delete: false, approve: false },
    purchaseOrder: { view: false, create: false, edit: false, delete: false, approve: false },
    penerimaanBarang: { view: false, create: false, edit: false, delete: false },
    pengeluaranBarang: { view: false, create: false, edit: false, delete: false, approve: false },
  },
  pemasaran: {
    pengirimanProduct: { view: false, create: false, edit: false, delete: false },
    hargaTransportir: { view: false, create: false, edit: false, delete: false },
    riwayatPengiriman: { view: false, create: false, edit: false, delete: false },
    contract: { view: false, create: false, edit: false, delete: false },
    invoice: { view: false, create: false, edit: false, delete: false },
  },
  payroll: {
    penggajian: { view: false, create: false, edit: false, delete: false },
  },
  keuangan: {
    hutangSupplier: { view: false, create: false, edit: false, delete: false },
    upahBongkar: { view: false, create: false, edit: false, delete: false },
    pembayaranTransportir: { view: false, create: false, edit: false, delete: false },
    pembayaranPr: { view: false, create: false, edit: false, delete: false },
    pembayaranPo: { view: false, create: false, edit: false, delete: false },
    biayaPengeluaran: { view: false, create: false, edit: false, delete: false },
    piutangCustomer: { view: false, create: false, edit: false, delete: false },
    neraca: { view: false, create: false, edit: false, delete: false },
  },
  settings: {
    users: { view: false, create: false, edit: false, delete: false },
    roles: { view: false, create: false, edit: false, delete: false },
    companies: { view: false, create: false, edit: false, delete: false },
    reports: { view: false, create: false, edit: false, delete: false },
  },
});

const mergePermissions = (
  base: Permission,
  saved?: Partial<Permission> | null
): Permission => {
  if (!saved) return base;

  const merged = structuredClone(base);

  for (const [categoryKey, categoryValue] of Object.entries(saved)) {
    if (!categoryValue || typeof categoryValue !== "object") continue;

    for (const [moduleKey, moduleValue] of Object.entries(categoryValue)) {
      if (!moduleValue || typeof moduleValue !== "object") continue;

      (merged as any)[categoryKey][moduleKey] = {
        ...(merged as any)[categoryKey][moduleKey],
        ...moduleValue,
      };
    }
  }

  return merged;
};

export function RoleForm({ roleId, onSuccess, onCancel }: RoleFormProps) {
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission>(getEmptyPermissions());
  const [serverError, setServerError] = useState("");

  const isEditMode = !!roleId;

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Fetch role data if edit mode
  const fetchRole = async () => {
    if (!roleId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/pt-pks/role/${roleId}`);
      if (!response.ok) throw new Error("Failed to fetch role");
      const result = await response.json();
      const role = result.role;

      form.reset({
        name: role.name || "",
        description: role.description || "",
      });

      setPermissions(mergePermissions(getEmptyPermissions(), role.permissions as Partial<Permission> | null));
    } catch (error) {
      console.error("Error fetching role:", error);
      setServerError("Gagal memuat data role");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      fetchRole();
    }
  }, [roleId]);

  // Handle permission change
  const handlePermissionChange = (
    category: keyof Permission,
    module: string,
    action: string,
    checked: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [module]: {
          ...(prev[category] as any)[module],
          [action]: checked,
        },
      },
    }));
  };

  // Handle select all for a module
  const handleSelectAllModule = (
    category: keyof Permission,
    module: string,
    checked: boolean
  ) => {
    const modulePermissions = (permissions[category] as any)[module];
    const newModulePermissions: Record<string, boolean> = {};

    for (const action in modulePermissions) {
      newModulePermissions[action] = checked;
    }

    setPermissions((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [module]: newModulePermissions,
      },
    }));
  };

  // Handle select all for a category
  const handleSelectAllCategory = (category: keyof Permission, checked: boolean) => {
    const categoryPermissions = permissions[category];
    const newCategoryPermissions: Record<string, Record<string, boolean>> = {};

    for (const module in categoryPermissions) {
      const modulePermissions = (categoryPermissions as any)[module];
      const newModulePermissions: Record<string, boolean> = {};

      for (const action in modulePermissions) {
        newModulePermissions[action] = checked;
      }
      newCategoryPermissions[module] = newModulePermissions;
    }

    setPermissions((prev) => ({
      ...prev,
      [category]: newCategoryPermissions,
    }));
  };

  // Check if all permissions in a module are selected
  const isAllModuleSelected = (category: keyof Permission, module: string): boolean => {
    const modulePermissions = (permissions[category] as any)?.[module];
    if (!modulePermissions) return false;
    return Object.values(modulePermissions).every((v) => v === true);
  };

  // Check if all permissions in a category are selected
  const isAllCategorySelected = (category: keyof Permission): boolean => {
    const categoryPermissions = permissions[category];
    for (const module in categoryPermissions) {
      const modulePermissions = (categoryPermissions as any)[module];
      for (const action in modulePermissions) {
        if (!modulePermissions[action]) return false;
      }
    }
    return true;
  };

  const onSubmit = async (data: RoleFormValues) => {
    setLoading(true);
    setServerError("");

    try {
      const url = isEditMode ? `/api/pt-pks/role/${roleId}` : "/api/pt-pks/role";
      const method = isEditMode ? "PUT" : "POST";

      const submitData = {
        ...data,
        permissions,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save role");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving role:", error);
      setServerError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load default admin permissions
  const loadAdminPermissions = async () => {
    try {
      const response = await fetch("/api/pt-pks/role/default-permissions?type=admin");
      if (!response.ok) throw new Error("Failed to fetch permissions");
      const result = await response.json();
      setPermissions(result.permissions);
    } catch (error) {
      console.error("Error loading admin permissions:", error);
    }
  };

  // Load default user permissions
  const loadUserPermissions = async () => {
    try {
      const response = await fetch("/api/pt-pks/role/default-permissions?type=user");
      if (!response.ok) throw new Error("Failed to fetch permissions");
      const result = await response.json();
      setPermissions(result.permissions);
    } catch (error) {
      console.error("Error loading user permissions:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Role" : "Tambah Role Baru"}</CardTitle>
        <CardDescription>
          {isEditMode
            ? "Ubah informasi dan permissions role yang ada"
            : "Tambahkan role baru dengan permissions yang sesuai"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {serverError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nama Role *</Label>
              <Input
                id="name"
                placeholder="Masukkan nama role"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi role (opsional)"
                {...form.register("description")}
              />
            </div>

            {/* Quick Permission Templates */}
            <div className="space-y-2">
              <Label>Template Permission</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadAdminPermissions}
                >
                  Full Access (Admin)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadUserPermissions}
                >
                  View Only (User)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPermissions(getEmptyPermissions())}
                >
                  Reset
                </Button>
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-2">
              <Label>Permissions</Label>
              <Accordion type="multiple" className="w-full">
                {Object.entries(permissionLabels).map(([categoryKey, category]) => (
                  <AccordionItem key={categoryKey} value={categoryKey}>
                    <div className="flex items-center gap-2 py-4">
                      <Checkbox
                        checked={isAllCategorySelected(categoryKey as keyof Permission)}
                        onCheckedChange={(checked) =>
                          handleSelectAllCategory(categoryKey as keyof Permission, !!checked)
                        }
                      />
                      <AccordionTrigger className="hover:no-underline py-0 flex-1">
                        <span>{category.label}</span>
                      </AccordionTrigger>
                    </div>
                    <AccordionContent>
                      <div className="space-y-4 pl-6">
                        {Object.entries(category.modules).map(([moduleKey, moduleLabel]) => {
                          const modulePermissions = (permissions[categoryKey as keyof Permission] as any)?.[moduleKey] || {};

                          return (
                            <div key={moduleKey} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={isAllModuleSelected(categoryKey as keyof Permission, moduleKey)}
                                  onCheckedChange={(checked) =>
                                    handleSelectAllModule(categoryKey as keyof Permission, moduleKey, !!checked)
                                  }
                                />
                                <span className="font-medium">{moduleLabel}</span>
                              </div>
                              <div className="flex flex-wrap gap-4 pl-6">
                                {Object.entries(modulePermissions).map(([actionKey, value]) => (
                                  <div key={actionKey} className="flex items-center gap-2">
                                    <Checkbox
                                      id={`${categoryKey}-${moduleKey}-${actionKey}`}
                                      checked={!!value}
                                      onCheckedChange={(checked) =>
                                        handlePermissionChange(
                                          categoryKey as keyof Permission,
                                          moduleKey,
                                          actionKey,
                                          !!checked
                                        )
                                      }
                                    />
                                    <Label
                                      htmlFor={`${categoryKey}-${moduleKey}-${actionKey}`}
                                      className="text-sm font-normal cursor-pointer"
                                    >
                                      {actionLabels[actionKey as keyof typeof actionLabels] || actionKey}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Simpan Perubahan" : "Tambah Role"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
