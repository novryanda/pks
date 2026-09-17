import { auth } from "@/server/auth";
import { DashboardSummaryView } from "@/components/dashboard/pt-pks/summary";
import { PermissionRedirect } from "@/components/dashboard/permission-redirect";

export default async function PTPKSPage() {
  const session = await auth();
  const isAdmin =
    session?.user?.role?.name === "Admin" ||
    session?.user?.role?.name === "Super Admin";

  return (
    <PermissionRedirect>
      <div className="space-y-6">

        {/* Admin Summary Dashboard */}
        {isAdmin ? (
          <DashboardSummaryView />
        ) : (
          // Non-admin view - basic info cards (akan di-redirect)
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Your Role</h3>
              </div>
              <div className="text-2xl font-bold">{session?.user?.role?.name}</div>
              <p className="text-xs text-muted-foreground">Current role</p>
            </div>

            <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Company</h3>
              </div>
              <div className="text-2xl font-bold">
                {session?.user?.company?.code}
              </div>
              <p className="text-xs text-muted-foreground">
                {session?.user?.company?.name}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm md:col-span-2">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Quick Access</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Gunakan menu sidebar untuk mengakses fitur-fitur yang tersedia sesuai dengan role Anda.
              </p>
            </div>
          </div>
        )}
      </div>
    </PermissionRedirect>
  );
}
