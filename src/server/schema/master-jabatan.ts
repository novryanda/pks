import { z } from "zod";

// Schema for creating jabatan
export const createJabatanSchema = z.object({
    id: z.string().min(1, "ID jabatan wajib diisi"),
    nama: z.string().min(1, "Nama jabatan wajib diisi"),
    divisiId: z.string().min(1, "Divisi wajib dipilih"),
    isActive: z.boolean().default(true),
});

// Schema for updating jabatan
export const updateJabatanSchema = createJabatanSchema.partial();

// Schema for jabatan id
export const jabatanIdSchema = z.object({
    id: z.string().min(1, "ID jabatan tidak valid"),
});

// Schema for query parameters
export const jabatanQuerySchema = z.object({
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    divisiId: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(50),
});

// Type exports
export type CreateJabatanInput = z.infer<typeof createJabatanSchema>;
export type UpdateJabatanInput = z.infer<typeof updateJabatanSchema>;
export type JabatanIdInput = z.infer<typeof jabatanIdSchema>;
export type JabatanQueryInput = z.infer<typeof jabatanQuerySchema>;
