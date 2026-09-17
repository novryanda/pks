/**
 * Weighing Buffer Module
 * 
 * In-memory buffer to store the latest weight data pushed by vendor.
 * Uses globalThis to persist data across Next.js dev hot-reloads.
 */

type WeightData = {
    weight: number;
    unit: string;
    vendorTimestamp: Date;
    receivedAt: Date;
};

type WeighingBuffer = {
    latestWeight: WeightData | null;
};

// Stale threshold in milliseconds (30 seconds)
const STALE_THRESHOLD_MS = 30 * 1000;

// Use globalThis to survive Next.js dev hot-reload
const globalForWeighing = globalThis as typeof globalThis & {
    weighingBuffer: WeighingBuffer | undefined;
};

function getBuffer(): WeighingBuffer {
    if (!globalForWeighing.weighingBuffer) {
        globalForWeighing.weighingBuffer = { latestWeight: null };
    }
    return globalForWeighing.weighingBuffer;
}

/**
 * Store weight data from vendor push
 */
export function pushWeight(
    weight: number,
    unit: string = "kg",
    vendorTimestamp?: Date
): void {
    const buffer = getBuffer();
    buffer.latestWeight = {
        weight,
        unit,
        vendorTimestamp: vendorTimestamp || new Date(),
        receivedAt: new Date(),
    };
}

/**
 * Get the latest weight data
 * Returns null if no data available
 */
export function readWeight(): (WeightData & { isStale: boolean }) | null {
    const buffer = getBuffer();

    if (!buffer.latestWeight) {
        return null;
    }

    const now = new Date();
    const age = now.getTime() - buffer.latestWeight.receivedAt.getTime();
    const isStale = age > STALE_THRESHOLD_MS;

    return {
        ...buffer.latestWeight,
        isStale,
    };
}

/**
 * Clear the weight buffer
 */
export function clearWeight(): void {
    const buffer = getBuffer();
    buffer.latestWeight = null;
}

/**
 * Check if there's valid weight data available
 */
export function hasWeight(): boolean {
    const buffer = getBuffer();
    return buffer.latestWeight !== null;
}
