import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, LayoutDashboard, Mic } from "lucide-react";

export function PTAnggunDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">PT. Zakiyah Talita Anggun</h2>
                    <p className="text-muted-foreground">Overview and quick actions for PT-ANGGUN.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-primary/20 bg-gradient-to-br from-card to-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Invoice Management</CardTitle>
                        <LayoutDashboard className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12 Active</div>
                        <p className="text-xs text-muted-foreground mt-1">Pending verification</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-emerald-500/20 bg-gradient-to-br from-card to-emerald-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">COA Status</CardTitle>
                        <Building2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8 Ready</div>
                        <p className="text-xs text-muted-foreground mt-1">Completed this month</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-blue-500/20 bg-gradient-to-br from-card to-blue-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Voice Assist</CardTitle>
                        <Mic className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Try Now</div>
                        <p className="text-xs text-muted-foreground mt-1">Input data via voice commands</p>
                    </CardContent>
                </Card>
            </div>

            {/* Placeholder for recent activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground italic">
                        No recent activity found.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
