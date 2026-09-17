
import dynamic from "next/dynamic";

const SupplierMapClient = dynamic(
  () => import("./supplier-map-client"),
  { ssr: false }
);

export function SupplierMap() {
  return <SupplierMapClient />;
}
