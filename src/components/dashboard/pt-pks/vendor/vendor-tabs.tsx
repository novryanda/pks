"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendorTable } from "@/components/dashboard/pt-pks/vendor/vendor-table";
import { VendorMaterialTable } from "@/components/dashboard/pt-pks/vendor-material/vendor-material-table";
import { VendorBongkarTable } from "@/components/dashboard/pt-pks/vendor-bongkar/vendor-bongkar-table";
import { Truck, Package, Hammer } from "lucide-react";
import { useUserPermissions } from "@/hooks/use-user-permissions";

export function VendorTabs() {
    const { hasModuleAccess, isLoading } = useUserPermissions();

    if (isLoading) return null;

    const canSeeTransportir = hasModuleAccess("masterData.driver"); // In AppSidebar, Driver uses driver permission, and Vendor (Transportir) uses vendor. Let's stick with vendor for transportir.
    const canSeeVendor = hasModuleAccess("masterData.vendor");
    const canSeeMaterial = hasModuleAccess("masterData.vendorMaterial");
    const canSeeBongkar = hasModuleAccess("masterData.vendorBongkar");

    const tabsCount = [canSeeVendor, canSeeMaterial, canSeeBongkar].filter(Boolean).length;

    return (
        <Tabs defaultValue={canSeeVendor ? "transportir" : canSeeMaterial ? "material" : "bongkar"} className="w-full">
            <TabsList className={`grid w-full max-w-xl`} style={{ gridTemplateColumns: `repeat(${tabsCount}, minmax(0, 1fr))` }}>
                {canSeeVendor && (
                    <TabsTrigger value="transportir" className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Vendor Transportir
                    </TabsTrigger>
                )}
                {canSeeMaterial && (
                    <TabsTrigger value="material" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Vendor Material
                    </TabsTrigger>
                )}
                {canSeeBongkar && (
                    <TabsTrigger value="bongkar" className="flex items-center gap-2">
                        <Hammer className="h-4 w-4" />
                        Vendor Bongkar
                    </TabsTrigger>
                )}
            </TabsList>

            {canSeeVendor && (
                <TabsContent value="transportir" className="mt-6">
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold">Vendor Transportir</h2>
                            <p className="text-sm text-muted-foreground">
                                Vendor untuk pengiriman product, termasuk data kendaraan dan supir
                            </p>
                        </div>
                        <VendorTable />
                    </div>
                </TabsContent>
            )}

            {canSeeMaterial && (
                <TabsContent value="material" className="mt-6">
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold">Vendor Material</h2>
                            <p className="text-sm text-muted-foreground">
                                Vendor untuk pengadaan barang (Purchase Request / Purchase Order)
                            </p>
                        </div>
                        <VendorMaterialTable />
                    </div>
                </TabsContent>
            )}

            {canSeeBongkar && (
                <TabsContent value="bongkar" className="mt-6">
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold">Vendor Bongkar</h2>
                            <p className="text-sm text-muted-foreground">
                                Vendor untuk jasa bongkar TBS (SPSI / SPLO)
                            </p>
                        </div>
                        <VendorBongkarTable />
                    </div>
                </TabsContent>
            )}
        </Tabs>
    );
}
