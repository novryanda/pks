import { auth } from "@/server/auth";
import { PTTAMDashboard } from "@/components/dashboard/pt-tam/dashboard-view";
import { PermissionRedirect } from "@/components/dashboard/permission-redirect";

export default async function PTTAMPage() {
    const session = await auth();

    return (
        <PermissionRedirect>
            <PTTAMDashboard />
        </PermissionRedirect>
    );
}
