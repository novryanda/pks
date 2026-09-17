import { z } from "zod";

// Schema untuk membuat log perubahan
export const createChangeLogSchema = z.object({
    masterKaryawanId: z.string().min(1),
    fieldName: z.string().min(1),
    oldValue: z.string().nullable().optional(),
    newValue: z.string().nullable().optional(),
    oldDisplayValue: z.string().nullable().optional(),
    newDisplayValue: z.string().nullable().optional(),
    changedBy: z.string().min(1),
});

export type CreateChangeLogInput = z.infer<typeof createChangeLogSchema>;

// Field yang akan di-track perubahannya
export const TRACKED_FIELDS = [
    { field: "divisiId", displayName: "Divisi" },
    { field: "jabatanId", displayName: "Jabatan" },
    { field: "gajiPokok", displayName: "Gaji Pokok" },
    { field: "tunjanganJabatan", displayName: "Tunjangan Jabatan" },
    { field: "tunjanganPerumahan", displayName: "Tunjangan Perumahan" },
    { field: "gol", displayName: "Golongan" },
    { field: "tktk", displayName: "Status Keluarga" },
    { field: "potBpjsTkJht", displayName: "BPJS TK JHT" },
    { field: "potBpjsTkJn", displayName: "BPJS TK JN" },
    { field: "potBpjsKesehatan", displayName: "BPJS Kesehatan" },
    { field: "isActive", displayName: "Status Aktif" },
] as const;

export type TrackedField = (typeof TRACKED_FIELDS)[number]["field"];
