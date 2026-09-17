import { auth } from "@/server/auth";

export default async function PTNILOPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {session?.user?.name}!
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with PT NILO today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Users</h3>
          </div>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">Active users</p>
        </div>

        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Your Role</h3>
          </div>
          <div className="text-2xl font-bold">{session?.user?.role?.name}</div>
          <p className="text-xs text-muted-foreground">Current role</p>
        </div>
      </div>
    </div>
  );
}
