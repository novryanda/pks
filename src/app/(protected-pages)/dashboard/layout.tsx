import { auth } from "@/server/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Footer } from "@/components/layout/footer";
import { NotificationBell } from "@/components/layout/notification-bell";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Middleware handles authentication and authorization
  // This component assumes user is already authorized to be here

  if (!session?.user) {
    // This should never happen due to middleware protection
    // But included for type safety
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <main className="flex-1 h-screen overflow-hidden flex flex-col">
        <div className="flex h-14 items-center justify-between border-b px-4 shrink-0">
          <div className="flex items-center">
            <SidebarTrigger />
            <h1 className="ml-4 text-lg font-semibold">
              {session.user.company?.name ?? "Dashboard"}
            </h1>
          </div>
          <NotificationBell />
        </div>
        <div className="p-6 flex-1 overflow-auto">{children}</div>
        <Footer />
      </main>
    </SidebarProvider>
  );
}
