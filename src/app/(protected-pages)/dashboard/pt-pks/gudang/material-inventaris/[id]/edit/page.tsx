import { MaterialInventarisEdit } from "@/components/dashboard/pt-pks/material-inventaris/material-inventaris-edit";

export default function EditMaterialPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="container mx-auto py-6">
      <MaterialInventarisEdit materialId={params.id} />
    </div>
  );
}
