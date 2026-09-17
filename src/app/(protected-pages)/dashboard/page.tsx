import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.company?.code) {
    redirect("/unauthorized");
  }

  // Redirect to company-specific dashboard
  redirect(`/dashboard/${session.user.company.code.toLowerCase()}`);
}
