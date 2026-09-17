import { useState, useCallback } from "react";
import { toast } from "sonner";

type WeightResult = {
    weight: number;
    timestamp: string;
};

type WeightData = {
    weight: number;
    unit: string;
    timestamp: string;
    receivedAt: string;
    isStale: boolean;
};

type UseWeighingScaleResult = {
    weight: number | null;
    loading: boolean;
    error: string | null;
    isStale: boolean;
    fetchWeight: () => Promise<WeightResult | null>;
};

/**
 * Hook untuk mengambil data berat dari timbangan
 * 
 * @example
 * const { loading, fetchWeight } = useWeighingScale();
 * 
 * const handleReadScale = async () => {
 *   const data = await fetchWeight();
 *   if (data) {
 *     setFormData({
 *       ...formData,
 *       beratBruto: data.weight,
 *       waktuTimbangBruto: new Date(data.timestamp),
 *     });
 *   }
 * };
 */
export function useWeighingScale(): UseWeighingScaleResult {
    const [weight, setWeight] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isStale, setIsStale] = useState(false);

    const fetchWeight = useCallback(async (): Promise<WeightResult | null> => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/weighing/read");
            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || "Gagal mengambil data timbangan");
            }

            if (!data.data) {
                setError("Belum ada data dari timbangan. Pastikan timbangan sudah mengirim data.");
                toast.warning("Belum ada data dari timbangan");
                return null;
            }

            const weightData = data.data as WeightData;

            if (weightData.isStale) {
                toast.warning("Data timbangan sudah lama (>30 detik). Pastikan data terbaru.");
            }

            setWeight(weightData.weight);
            setIsStale(weightData.isStale);
            toast.success(`Berat: ${weightData.weight.toLocaleString("id-ID")} kg`);

            return {
                weight: weightData.weight,
                timestamp: weightData.timestamp,
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : "Terjadi kesalahan";
            setError(message);
            toast.error(message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        weight,
        loading,
        error,
        isStale,
        fetchWeight,
    };
}
