import { auth } from "@/server/auth";
import { PTAnggunDashboard } from "@/components/dashboard/pt-anggun/dashboard-view";
import { PermissionRedirect } from "@/components/dashboard/permission-redirect";

export default async function PTAnggunPage() {
    const session = await auth();

    return (
        <PermissionRedirect>
            <PTAnggunDashboard />
        </PermissionRedirect>
    );
}
