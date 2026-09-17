"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockTBSDashboard } from "@/components/dashboard/pt-pks/stock-tbs/stock-tbs-dashboard";
import { StockTBSTrendChart } from "@/components/dashboard/pt-pks/stock-tbs/stock-tbs-trend-chart";
import { BarChart3, LayoutDashboard } from "lucide-react";

export default function StockTBSPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trend" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Trend Periode
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <StockTBSDashboard />
        </TabsContent>
        <TabsContent value="trend" className="mt-6">
          <StockTBSTrendChart />
        </TabsContent>
      </Tabs>
    </div>
  );
}
