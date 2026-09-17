import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, LayoutDashboard, Settings } from "lucide-react";

export function PTTAMDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">PT. TAM</h2>
                    <p className="text-muted-foreground">Enterprise Resource Management.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-gradient-to-br from-card to-indigo-500/5 border-indigo-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Assets</CardTitle>
                        <Building className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Manage</div>
                        <p className="text-xs text-muted-foreground mt-1">Property & Inventory</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-card to-slate-500/5 border-slate-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Config</CardTitle>
                        <Settings className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Settings</div>
                        <p className="text-xs text-muted-foreground mt-1">System parameters</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
