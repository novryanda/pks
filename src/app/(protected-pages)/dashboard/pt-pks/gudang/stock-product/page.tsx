"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockProductList } from "@/components/dashboard/pt-pks/stock-product/stock-product-list";
import { StockProductTrendChart } from "@/components/dashboard/pt-pks/stock-product/stock-product-trend-chart";
import { BarChart3, LayoutDashboard } from "lucide-react";

export default function StockProductPage() {
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
          <StockProductList />
        </TabsContent>
        <TabsContent value="trend" className="mt-6">
          <StockProductTrendChart />
        </TabsContent>
      </Tabs>
    </div>
  );
}
