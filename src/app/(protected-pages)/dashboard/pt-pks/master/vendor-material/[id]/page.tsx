import { VendorMaterialDetail } from "@/components/dashboard/pt-pks/vendor-material/vendor-material-detail";
import { notFound } from "next/navigation";
import { db } from "@/server/db";

interface Props {
    params: Promise<{
        id: string;
    }>;
}

async function getVendorMaterial(id: string) {
    try {
        return await db.vendorMaterial.findUnique({
            where: { id },
        });
    } catch (error) {
        console.error("Error fetching vendor material:", error);
        return null;
    }
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    const vendor = await getVendorMaterial(id);
    return {
        title: vendor ? `${vendor.name} | PT PKS` : "Vendor Material Tidak Ditemukan",
        description: vendor ? `Detail vendor material ${vendor.name}` : "Vendor material tidak ditemukan",
    };
}

export default async function VendorMaterialDetailPage({ params }: Props) {
    const { id } = await params;
    const vendor = await getVendorMaterial(id);

    if (!vendor) {
        notFound();
    }

    return <VendorMaterialDetail vendor={vendor} />;
}
