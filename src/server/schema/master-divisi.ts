import { z } from "zod";

// Schema for creating divisi
export const createDivisiSchema = z.object({
    id: z.string().min(1, "ID divisi wajib diisi"),
    nama: z.string().min(1, "Nama divisi wajib diisi"),
    isActive: z.boolean().default(true),
});

// Schema for updating divisi
export const updateDivisiSchema = createDivisiSchema.partial();

// Schema for divisi id
export const divisiIdSchema = z.object({
    id: z.string().min(1, "ID divisi tidak valid"),
});

// Schema for query parameters
export const divisiQuerySchema = z.object({
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(50),
});

// Type exports
export type CreateDivisiInput = z.infer<typeof createDivisiSchema>;
export type UpdateDivisiInput = z.infer<typeof updateDivisiSchema>;
export type DivisiIdInput = z.infer<typeof divisiIdSchema>;
export type DivisiQueryInput = z.infer<typeof divisiQuerySchema>;
