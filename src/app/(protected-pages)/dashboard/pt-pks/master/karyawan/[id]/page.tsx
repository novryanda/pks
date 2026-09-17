import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { KaryawanDetailPage } from "@/components/dashboard/pt-pks/karyawan/karyawan-detail-page";

export default async function KaryawanDetailPageRoute({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <KaryawanDetailPage karyawanId={id} />
        </Suspense>
    );
}
