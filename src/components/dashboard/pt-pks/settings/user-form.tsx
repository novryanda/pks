"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Role = {
  id: string;
  name: string;
  description: string | null;
  _count: {
    users: number;
  };
};

// Schema for form validation
const createUserSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  roleId: z.string().min(1, "Role harus dipilih"),
});

const updateUserSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().optional().refine(
    (val) => !val || val.length >= 6,
    "Password minimal 6 karakter"
  ),
  roleId: z.string().min(1, "Role harus dipilih"),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
type UserFormValues = CreateUserFormValues | UpdateUserFormValues;

type UserFormProps = {
  userId?: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export function UserForm({ userId, onSuccess, onCancel }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [serverError, setServerError] = useState("");

  const isEditMode = !!userId;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEditMode ? updateUserSchema : createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roleId: "",
    },
  });

  // Fetch roles for select
  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await fetch("/api/pt-pks/role");
      if (!response.ok) throw new Error("Failed to fetch roles");
      const result = await response.json();
      setRoles(result.roles || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoadingRoles(false);
    }
  };

  // Fetch user data if edit mode
  const fetchUser = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/pt-pks/user/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      const result = await response.json();
      const user = result.user;
      
      form.reset({
        name: user.name || "",
        email: user.email || "",
        password: "",
        roleId: user.roleId || "",
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      setServerError("Gagal memuat data user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    if (isEditMode) {
      fetchUser();
    }
  }, [userId]);

  const onSubmit = async (data: UserFormValues) => {
    setLoading(true);
    setServerError("");

    try {
      const url = isEditMode ? `/api/pt-pks/user/${userId}` : "/api/pt-pks/user";
      const method = isEditMode ? "PUT" : "POST";

      // Remove password if empty in edit mode
      const submitData = { ...data };
      if (isEditMode && !submitData.password) {
        delete (submitData as any).password;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save user");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving user:", error);
      setServerError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit User" : "Tambah User Baru"}</CardTitle>
        <CardDescription>
          {isEditMode
            ? "Ubah informasi user yang ada"
            : "Tambahkan user baru ke sistem"}
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
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input
                id="name"
                placeholder="Masukkan nama lengkap"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {isEditMode ? "(kosongkan jika tidak ingin mengubah)" : "*"}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={isEditMode ? "••••••••" : "Masukkan password"}
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="roleId">Role *</Label>
              <Select
                value={form.watch("roleId")}
                onValueChange={(value) => form.setValue("roleId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {loadingRoles ? (
                    <SelectItem value="loading" disabled>
                      Memuat...
                    </SelectItem>
                  ) : (
                    roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name} {role.description && `- ${role.description}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.roleId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.roleId.message}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Simpan Perubahan" : "Tambah User"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
