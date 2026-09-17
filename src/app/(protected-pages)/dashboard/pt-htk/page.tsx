import { auth } from "@/server/auth";
import { PTHTKDashboard } from "@/components/dashboard/pt-htk/dashboard-view";
import { PermissionRedirect } from "@/components/dashboard/permission-redirect";

export default async function PTHTKPage() {
  const session = await auth();

  return (
    <PermissionRedirect>
      <PTHTKDashboard />
    </PermissionRedirect>
  );
}
