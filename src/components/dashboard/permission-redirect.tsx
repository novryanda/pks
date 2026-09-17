"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import { Loader2 } from "lucide-react";

interface PermissionRedirectProps {
  children: React.ReactNode;
}

/**
 * Component that redirects non-admin users to their first accessible route
 * Admin users will see the children (dashboard content)
 */
export function PermissionRedirect({ children }: PermissionRedirectProps) {
  const router = useRouter();
  const { isAdmin, isLoading, getFirstAccessibleRoute } = useUserPermissions();

  useEffect(() => {
    if (isLoading) return;

    // Only redirect non-admin users
    if (!isAdmin) {
      const firstRoute = getFirstAccessibleRoute();
      if (firstRoute) {
        router.replace(firstRoute);
      }
    }
  }, [isAdmin, isLoading, getFirstAccessibleRoute, router]);

  // Show loading state while checking permissions
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  // Non-admin users will be redirected, show loading during redirect
  if (!isAdmin) {
    const firstRoute = getFirstAccessibleRoute();
    if (firstRoute) {
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Mengarahkan ke halaman Anda...</p>
          </div>
        </div>
      );
    }
    
    // No accessible route found for non-admin
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Tidak Ada Akses</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Anda tidak memiliki akses ke modul apapun. Silakan hubungi administrator.
          </p>
        </div>
      </div>
    );
  }

  // Admin users see the dashboard content
  return <>{children}</>;
}
