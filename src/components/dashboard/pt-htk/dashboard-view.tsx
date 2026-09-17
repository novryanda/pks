import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, FileText, LayoutDashboard } from "lucide-react";

export function PTHTKDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">PT. Husni Tamrin Kerinci</h2>
                    <p className="text-muted-foreground">Logistics and Trucking operations overview.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-gradient-to-br from-card to-blue-500/5 border-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Fleet</CardTitle>
                        <Truck className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">24 Units</div>
                        <p className="text-xs text-muted-foreground mt-1">On duty today</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-card to-emerald-500/5 border-emerald-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Deliveries</CardTitle>
                        <FileText className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">142</div>
                        <p className="text-xs text-muted-foreground mt-1">This month</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-card to-amber-500/5 border-amber-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Summary</CardTitle>
                        <LayoutDashboard className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">View Reports</div>
                        <p className="text-xs text-muted-foreground mt-1">Logistics performance</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
