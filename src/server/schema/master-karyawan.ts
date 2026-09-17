import { z } from "zod";

// Schema for creating karyawan
export const createKaryawanSchema = z.object({
    namaKaryawan: z.string().min(1, "Nama karyawan wajib diisi"),
    divisiId: z.string().optional().nullable(),
    jabatanId: z.string().optional().nullable(),
    gol: z.string().optional().nullable(),
    tktk: z.enum(["TK", "K0", "K1", "K2", "K3"]).optional().nullable(),
    nomorRekening: z.string().optional().nullable(),
    noBpjsTk: z.string().optional().nullable(),
    noBpjsKesehatan: z.string().optional().nullable(),
    gajiPokok: z.number().default(0),
    tunjanganJabatan: z.number().default(0),
    tunjanganPerumahan: z.number().default(0),
    potBpjsTkJht: z.number().default(0),
    potBpjsTkJn: z.number().default(0),
    potBpjsKesehatan: z.number().default(0),
    tanggalMulaiKerja: z.coerce.date().optional().nullable(),
    tanggalKeluar: z.coerce.date().optional().nullable(),
    isActive: z.boolean().default(true),
});

// Schema for updating karyawan
export const updateKaryawanSchema = createKaryawanSchema.partial();

// Schema for karyawan id
export const karyawanIdSchema = z.object({
    id: z.string().cuid("ID karyawan tidak valid"),
});

// Schema for query parameters
export const karyawanQuerySchema = z.object({
    search: z.string().optional(),
    divisiId: z.string().optional(),
    jabatanId: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(1000).default(100),
});

// Type exports
export type CreateKaryawanInput = z.infer<typeof createKaryawanSchema>;
export type UpdateKaryawanInput = z.infer<typeof updateKaryawanSchema>;
export type KaryawanIdInput = z.infer<typeof karyawanIdSchema>;
export type KaryawanQueryInput = z.infer<typeof karyawanQuerySchema>;
