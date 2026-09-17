import { auth } from "@/server/auth";
import { PTNiloDashboard } from "@/components/dashboard/pt-nilo/dashboard-view";
import { PermissionRedirect } from "@/components/dashboard/permission-redirect";

export default async function PTNiloPage() {
  const session = await auth();

  return (
    <PermissionRedirect>
      <PTNiloDashboard />
    </PermissionRedirect>
  );
}
