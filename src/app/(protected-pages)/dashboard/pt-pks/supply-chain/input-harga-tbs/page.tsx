"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputHargaList } from "@/components/dashboard/pt-pks/penerimaan-tbs/input-harga-list";
import { DollarSign } from "lucide-react";

export default function InputHargaTBSPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Input Harga TBS</h1>
        <p className="text-muted-foreground">
          Input harga untuk penerimaan TBS yang sudah selesai proses timbangan
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Penerimaan Menunggu Input Harga
          </CardTitle>
          <CardDescription>
            Daftar penerimaan TBS yang sudah selesai timbangan dan menunggu input harga
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InputHargaList key={`harga-${refreshKey}`} onRefresh={handleRefresh} />
        </CardContent>
      </Card>
    </div>
  );
}
