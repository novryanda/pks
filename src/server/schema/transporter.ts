import { z } from "zod";

// Schema untuk Transporter
export const createTransporterSchema = z.object({
  nomorKendaraan: z.string().min(1, "Nomor kendaraan harus diisi"),
  namaSupir: z.string().min(1, "Nama supir harus diisi"),
  telepon: z.string().optional(),
});

export const updateTransporterSchema = createTransporterSchema.partial();

export type CreateTransporterInput = z.infer<typeof createTransporterSchema>;
export type UpdateTransporterInput = z.infer<typeof updateTransporterSchema>;
