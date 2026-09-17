"use client";

import type { ReactNode } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import type { PermissionAction } from "@/lib/rbac";
import { useUserPermissions } from "@/hooks/use-user-permissions";

type ModuleAccessGuardProps = {
  module: string;
  action?: PermissionAction;
  children: ReactNode;

};


export function ModuleAccessGuard({
  module,
  action = "view",
  children,
}: ModuleAccessGuardProps) {
  const { isLoading, hasActionAccess } = useUserPermissions();

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasActionAccess(module, action)) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="max-w-md text-center">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Akses Ditolak</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Anda tidak memiliki izin `{action}` untuk modul `{module}`.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
