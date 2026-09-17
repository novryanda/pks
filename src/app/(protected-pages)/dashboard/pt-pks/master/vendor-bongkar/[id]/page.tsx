import { VendorBongkarDetail } from "@/components/dashboard/pt-pks/vendor-bongkar/vendor-bongkar-detail";

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function VendorBongkarDetailPage({ params }: PageProps) {
    const { id } = await params;
    return <VendorBongkarDetail id={id} />;
}
